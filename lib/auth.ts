import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";
import { Resend } from "resend";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

async function sendResendEmailWithFallback({
  resend,
  from,
  to,
  subject,
  html,
}: {
  resend: Resend;
  from: string;
  to: string | string[];
  subject: string;
  html: string;
}) {
  try {
    await resend.emails.send({ from, to, subject, html });
    return;
  } catch {
    if (from.toLowerCase().includes("onboarding@resend.dev")) throw new Error("resend_send_failed");
    await resend.emails.send({
      from: "Helping Hand <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
        if (account.status !== "approved") return null;
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
        const adminList = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

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
              status: "approved",
            });
          } catch {
            return "/login?error=permissions";
          }
        }

        if (!acct) {
          if (!canWrite) return "/login?error=missing_token";

          const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
          try {
            acct = await writeClient.create({
              _type: "account",
              email,
              name,
              type: "individual",
              status: "pending",
            });
          } catch {
            return "/login?error=permissions";
          }

          const resendKey = process.env.RESEND_API_KEY || "";
          if (resendKey) {
            const resendFrom = process.env.RESEND_FROM || "Helping Hand <onboarding@resend.dev>";
            const resend = new Resend(resendKey);
            try {
              await sendResendEmailWithFallback({
                resend,
                from: resendFrom,
                to: email,
                subject: "Your account is pending approval",
                html: `<p>Thanks for signing up. Your account is pending approval. You'll be notified once approved.</p>`,
              });
              const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
              if (adminEmails.length) {
                await sendResendEmailWithFallback({
                  resend,
                  from: resendFrom,
                  to: adminEmails,
                  subject: "New account pending approval",
                  html: `<p>${name || email} requested an individual account.</p><p>Sanity ID: ${(acct as any)._id}</p>`,
                });
              }
            } catch {}
          }
        }

        if (acct && adminList.includes(emailLower) && (acct.type !== "admin" || acct.status !== "approved")) {
          if (!canWrite) return "/login?error=missing_token";
          const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
          try {
            acct = await writeClient.patch((acct as any)._id).set({ type: "admin", status: "approved" }).commit();
          } catch {
            return "/login?error=permissions";
          }
        }

        if (!acct || (acct as any).status !== "approved") {
          return "/login?pending=1";
        }
      }
      return true;
    },
    async jwt({ token, account, user }) {
      if (account?.provider === "google") {
        (token as any).provider = "google";
        const email = String((user as any)?.email || (token as any)?.email || "");
        if (email) {
          try {
            const acct = await fetchSanityAccountByEmail({ email });
            (token as any).isAdmin = acct?.type === "admin" && acct?.status === "approved";
            (token as any).type = acct?.type;
          } catch {}
        }
      }
      if (account?.provider === "credentials" && user) {
        (token as any).provider = "credentials";
        (token as any).isAdmin = (user as any).isAdmin;
        (token as any).type = (user as any).type;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).provider = (token as any).provider;
      (session as any).isAdmin = (token as any).isAdmin;
      (session as any).type = (token as any).type;
      return session;
    },
  },
};

export async function safeGetServerSession() {
  try {
    const { getServerSession } = await import("next-auth");
    return await getServerSession(authOptions);
  } catch {
    return null;
  }
}
