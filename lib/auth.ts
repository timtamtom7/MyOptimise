import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { fetchSanityAccountByEmail, fetchSanityAccountById } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";
import crypto from "crypto";
import { resolveCapabilities } from "@/lib/capabilities";
import { cookies } from "next/headers";

export const IMPERSONATE_COOKIE_NAME = "impersonateAccountId";
export const IMPERSONATE_ORIGINAL_EMAIL_COOKIE = "impersonateOriginalEmail";

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
      async signIn({ account, profile, user }: any) {
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
      async jwt({ token, account, user }: any) {
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

            const caps = resolveCapabilities(
              acct.type || "employee",
              (acct.capabilities as string[]) || [],
              (acct.revokedCapabilities as string[]) || []
            );
            (token as any).capabilities = caps;

            // Handle Impersonation
            // We check if the user is an admin OR if they are already impersonating (which means they were an admin)
            const isAdminOrImpersonating = (token as any).isAdmin || (token as any).isImpersonating;
            
            if (isAdminOrImpersonating) {
              const cookieStore = await cookies();
              const impersonateId = cookieStore.get(IMPERSONATE_COOKIE_NAME)?.value;

              if (impersonateId) {
                 // CASE 1: Impersonation Cookie Exists (Start or Continue Impersonation)
                 const impersonatedAcct = await fetchSanityAccountById({ id: impersonateId });
                 if (impersonatedAcct && impersonatedAcct.status !== "disabled") {
                    (token as any).isImpersonating = true;
                    // If we are starting impersonation, save the original details
                    // We check if we are currently the original user before saving
                    // If isImpersonating is false, we are the original user
                    
                    // DEBUG LOGGING
                    console.log("[Auth] Impersonation Check - Token:", { 
                        isImpersonating: (token as any).isImpersonating, 
                        originalEmail: (token as any).originalUserEmail,
                        currentEmail: email 
                    });

                    if (!(token as any).isImpersonating || !(token as any).originalUserEmail) {
                        // Use the current token/user info as the original
                        if (!(token as any).originalUserEmail) {
                           // If we are starting impersonation, 'email' variable holds the current user's email (Admin)
                           (token as any).originalUserEmail = email;
                           (token as any).originalAccountId = acct._id;
                        }
                    }
                    
                    // Override with impersonated user details
                    (token as any).accountId = impersonatedAcct._id;
                    (token as any).email = impersonatedAcct.email;
                    (token as any).name = impersonatedAcct.name;
                    (token as any).type = impersonatedAcct.type;
                    (token as any).isAdmin = impersonatedAcct.type === "admin"; // Usually false
                    (token as any).sessionVersion = typeof impersonatedAcct.sessionVersion === "number" && Number.isFinite(impersonatedAcct.sessionVersion) 
                        ? impersonatedAcct.sessionVersion 
                        : 1;
                    
                    const impCaps = resolveCapabilities(
                      impersonatedAcct.type || "employee",
                      (impersonatedAcct.capabilities as string[]) || [],
                      (impersonatedAcct.revokedCapabilities as string[]) || []
                    );
                    (token as any).capabilities = impCaps;
                 }
              } else if ((token as any).isImpersonating) {
                  // CASE 2: Impersonation Cookie Missing but Flag True (Stop Impersonation)
                  // Restore original user
                  const originalEmail = (token as any).originalUserEmail;
                  const originalAccountId = (token as any).originalAccountId;
                  
                  // Fallback to cookie if token not populated (older sessions)
                  const cookieStore = await cookies();
                  const originalEmailCookie = cookieStore.get(IMPERSONATE_ORIGINAL_EMAIL_COOKIE)?.value;
                  
                  console.log("[Auth] Stopping impersonation. Token Original Email:", originalEmail, "Token Original ID:", originalAccountId, "Cookie Original:", originalEmailCookie);

                  let originalAcct;

                  if (originalAccountId) {
                      originalAcct = await fetchSanityAccountById({ id: originalAccountId });
                  }

                  const emailToRestore = originalEmail || originalEmailCookie;

                  if (!originalAcct && emailToRestore) {
                      originalAcct = await fetchSanityAccountByEmail({ email: emailToRestore });
                  }
                  
                  if (originalAcct && originalAcct.status !== "disabled") {
                      console.log("[Auth] Restoring original account:", originalAcct.email);
                      (token as any).accountId = originalAcct._id;
                      (token as any).email = originalAcct.email;
                      (token as any).name = originalAcct.name;
                      (token as any).type = originalAcct.type;
                      (token as any).isAdmin = originalAcct.type === "admin";
                      (token as any).sessionVersion = typeof originalAcct.sessionVersion === "number" && Number.isFinite(originalAcct.sessionVersion)
                        ? originalAcct.sessionVersion
                        : 1;

                      const caps = resolveCapabilities(
                        originalAcct.type || "employee",
                        (originalAcct.capabilities as string[]) || [],
                        (originalAcct.revokedCapabilities as string[]) || []
                      );
                      (token as any).capabilities = caps;

                      // Clean up
                      delete (token as any).isImpersonating;
                      delete (token as any).originalUserEmail;
                      delete (token as any).originalAccountId;
                  } else {
                      console.error("[Auth] Original account disabled or not found:", emailToRestore);
                      (token as any).invalid = true;
                  }
              }
            }

            if (account) {
              await recordLogin({ accountId: String(acct._id), provider: provider || String(account.provider || "") });
            }
          } catch {}
        }
        return token;
      },
      async session({ session, token }: any) {
        if ((token as any)?.invalid) {
          throw new Error("Session invalidated");
        }
        (session as any).provider = (token as any).provider;
        (session as any).isAdmin = (token as any).isAdmin;
        (session as any).type = (token as any).type;
        (session as any).accountId = (token as any).accountId;
        (session as any).sessionVersion = (token as any).sessionVersion;
        (session as any).capabilities = (token as any).capabilities;
        (session as any).isImpersonating = (token as any).isImpersonating;
        (session as any).originalUserEmail = (token as any).originalUserEmail;
        return session;
      },
    },
  };
}

export async function safeGetServerSession() {
  try {
    const { getServerSession } = await import("next-auth");
    let result = await getServerSession(getAuthOptions());

    if (!result) {
      const isPreview = Boolean(process.env.VERCEL_PREVIEW_URL);
      const isDev = process.env.NODE_ENV !== "production";
      if (isDev || isPreview) {
        try {
          const cookieStore = await cookies();
          const impersonateId = cookieStore.get(IMPERSONATE_COOKIE_NAME)?.value;
          if (impersonateId) {
            const acct = await fetchSanityAccountById({ id: impersonateId });
            if (acct && acct.status !== "disabled") {
              const caps = resolveCapabilities(
                acct.type || "employee",
                (acct.capabilities as string[]) || [],
                (acct.revokedCapabilities as string[]) || []
              );
              return {
                user: { name: acct.name, email: acct.email, image: null },
                expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                provider: "dev-bypass",
                isAdmin: acct.type === "admin",
                type: acct.type,
                accountId: acct._id,
                sessionVersion:
                  typeof (acct as any).sessionVersion === "number" && Number.isFinite((acct as any).sessionVersion)
                    ? (acct as any).sessionVersion
                    : 1,
                capabilities: caps,
              } as any;
            }
          }
        } catch {}
      }
    }

    return result;
  } catch {
    return null;
  }
}
