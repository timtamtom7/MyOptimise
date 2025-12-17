import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import bcrypt from "bcryptjs";
import { client } from "@/sanity/lib/client";
import { token as previewToken } from "@/sanity/lib/token";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
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
        if (email) {
          const existing = await fetchSanityAccountByEmail({ email });
          if (!existing) {
            const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
            if (writeToken) {
              const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
              try {
                await writeClient.create({
                  _type: "account",
                  email,
                  name: (user as any)?.name || "",
                  type: "individual",
                  status: "pending",
                });
              } catch {}
            }
          }
          const adminList = (process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
          if (adminList.includes(email.toLowerCase())) {
            const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
            if (writeToken) {
              const writeClient = client.withConfig({ token: writeToken, perspective: "published" });
              try {
                const acct = existing ?? (await fetchSanityAccountByEmail({ email }));
                if (!acct) {
                  await writeClient.create({
                    _type: "account",
                    email,
                    name: (user as any)?.name || "",
                    type: "admin",
                    status: "approved",
                  });
                } else if (acct.type !== "admin" || acct.status !== "approved") {
                  await writeClient.patch(acct._id).set({ type: "admin", status: "approved" }).commit();
                }
              } catch {}
            }
          }
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
