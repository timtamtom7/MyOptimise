import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";
import crypto from "crypto";

export function getGoogleOAuthConfig(): { clientId: string; clientSecret: string } {
  const clientId =
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    "";
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET?.trim() ||
    "";
  return { clientId, clientSecret };
}

const devNextAuthSecret =
  process.env.NODE_ENV === "development"
    ? crypto.createHash("sha256").update(process.cwd()).digest("hex")
    : undefined;

export function getAuthOptions(): NextAuthOptions {
  const { clientId: googleClientId, clientSecret: googleClientSecret } = getGoogleOAuthConfig();
  const isDev = process.env.NODE_ENV === "development";
  const nextAuthSecret = process.env.NEXTAUTH_SECRET?.trim();
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";

  async function recordLogin(params: { accountId: string; provider: string }) {
    if (!writeToken) return;
    const now = new Date().toISOString();
    const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
    await writeClient
      .patch(params.accountId)
      .set({ lastLoginAt: now })
      .setIfMissing({ loginHistory: [] })
      .append("loginHistory", [{ provider: params.provider, createdAt: now }])
      .commit();
  }

  return {
    secret: nextAuthSecret || devNextAuthSecret,
    cookies: isDev
      ? {
          sessionToken: {
            name: "next-auth.session-token.dev-v2",
            options: {
              httpOnly: true,
              sameSite: "lax",
              path: "/",
              secure: false,
            },
          },
        }
      : undefined,
    providers: [
      CredentialsProvider({
        name: "Email and Password",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const email = String(credentials?.email || "");
          const password = String(credentials?.password || "");
          if (!email || !password) return null;
          const account = await fetchSanityAccountByEmail({ email });
          if (!account) return null;
          if (account.status === "disabled") return null;
          const hash = account.passwordHash || "";
          const match = hash ? await bcrypt.compare(password, hash) : false;
          if (!match) return null;
          return {
            id: account._id,
            email: account.email,
            name: account.name,
            type: account.type,
            provider: "credentials",
            isAdmin: account.type === "admin",
          } as any;
        },
      }),
      ...(googleClientId && googleClientSecret
        ? [
            GoogleProvider({
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            }),
          ]
        : []),
    ],
    pages: {
      signIn: "/login",
      error: "/login",
    },
    session: { strategy: "jwt" },
    callbacks: {
      async signIn({ account, profile, user }) {
        if (account?.provider === "google") {
          const email = String((user as any)?.email || (profile as any)?.email || "");
          if (!email) return true;

          const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
          const canWrite = Boolean(writeToken);
          const emailLower = email.toLowerCase();
          const name = String((user as any)?.name || "");
          const adminList = (process.env.ADMIN_EMAILS || "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

          let acct = await fetchSanityAccountByEmail({ email });

          if (!acct && adminList.includes(emailLower)) {
            if (!canWrite) return "/login?error=missing_token";
            const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
            try {
              acct = await writeClient.create({
                _type: "account",
                email,
                name,
                type: "admin",
                status: "active",
                sessionVersion: 1,
              });
            } catch {
              return "/login?error=permissions";
            }
          }

          if (!acct) {
            return "/login?error=no_account";
          }

          if ((acct as any).status === "disabled") {
            return "/login?error=disabled";
          }
        }
        return true;
      },
      async jwt({ token, account, user }) {
        const provider = String(account?.provider || (token as any).provider || "");
        if (provider) (token as any).provider = provider;

        const email = String((user as any)?.email || (token as any)?.email || "");
        if (email) {
          try {
            const acct = await fetchSanityAccountByEmail({ email });
            if (!acct || String(acct.status || "") === "disabled") {
              (token as any).invalid = true;
              return token;
            }

            const currentSessionVersionRaw = (acct as any).sessionVersion;
            const currentSessionVersion =
              typeof currentSessionVersionRaw === "number" && Number.isFinite(currentSessionVersionRaw)
                ? currentSessionVersionRaw
                : 1;

            const existingSessionVersionRaw = (token as any).sessionVersion;
            const hasExistingSessionVersion =
              typeof existingSessionVersionRaw === "number" && Number.isFinite(existingSessionVersionRaw);
            if (hasExistingSessionVersion && existingSessionVersionRaw !== currentSessionVersion) {
              (token as any).invalid = true;
              return token;
            }

            (token as any).accountId = acct._id;
            (token as any).sessionVersion = currentSessionVersion;
            (token as any).isAdmin = acct.type === "admin" && acct.status !== "disabled";
            (token as any).type = acct.type;

            if (account) {
              await recordLogin({ accountId: String(acct._id), provider: provider || String(account.provider || "") });
            }
          } catch {}
        }
        return token;
      },
      async session({ session, token }) {
        if ((token as any)?.invalid) {
          throw new Error("Session invalidated");
        }
        (session as any).provider = (token as any).provider;
        (session as any).isAdmin = (token as any).isAdmin;
        (session as any).type = (token as any).type;
        (session as any).accountId = (token as any).accountId;
        (session as any).sessionVersion = (token as any).sessionVersion;
        return session;
      },
    },
  };
}

export async function safeGetServerSession() {
  try {
    const { getServerSession } = await import("next-auth");
    return await getServerSession(getAuthOptions());
  } catch {
    return null;
  }
}



