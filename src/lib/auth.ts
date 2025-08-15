// src/lib/auth.ts
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");
const defaultFrom = process.env.RESEND_FROM || "DirectPlay <send@directplay.in>";

function loginEmailHTML(url: string) {
    return `
  <div style="font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6">
    <h2>Sign in to DirectPlay</h2>
    <p>Click the button below to sign in. This link expires in 10 minutes.</p>
    <p><a href="${url}" style="display:inline-block;background:#111827;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Sign in</a></p>
    <p style="color:#6b7280;font-size:12px">If the button doesn’t work, copy and paste this link into your browser:<br/>${url}</p>
  </div>`;
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: { strategy: "database" },
    providers: [
        EmailProvider({
            maxAge: 10 * 60, // 10 minutes
            async sendVerificationRequest({ identifier, url }) {
                if (!process.env.RESEND_API_KEY) {
                    throw new Error("RESEND_API_KEY not set");
                }
                await resend.emails.send({
                    from: defaultFrom,
                    to: identifier,
                    subject: "Your sign-in link for DirectPlay",
                    html: loginEmailHTML(url),
                    headers: {
                        "List-Unsubscribe":
                            "<mailto:unsubscribe@directplay.in>, <https://directplay.in/unsubscribe>",
                    },
                });
            },
        }),
    ],
    pages: {
        signIn: "/auth",
        verifyRequest: "/auth?view=signin",
    },
    callbacks: {
        async session({ session, user }: { session: any; user: any }) {
            if (session?.user) (session.user as any).id = user.id;
            return session;
        },
        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            try {
                const u = new URL(url, baseUrl);

                // If same-origin and a relative path is provided, use it
                if (u.origin === baseUrl) {
                    // Avoid bouncing back to auth or root; send to dashboard instead
                    if (u.pathname === "/" || u.pathname.startsWith("/auth")) {
                        return "/dashboard";
                    }
                    return u.pathname + u.search + u.hash;
                }
            } catch {
                /* ignore parse errors, fall through */
            }
            // Default after successful auth
            return "/dashboard";
        },
    },
    // NEXTAUTH_SECRET or AUTH_SECRET — either is fine.
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};