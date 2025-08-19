// src/lib/auth.ts
import type { NextAuthOptions, Session, User } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

/* ---------------- Types ---------------- */

type AppRole = "user" | "admin";

export type AppSessionUser = {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    /** copied from DB if present */
    role?: AppRole;
    /**
     * computed at session time:
     * - true if DB role === 'admin'
     * - or legacy DB flag isAdmin === true
     * - or email is present in ADMIN_EMAILS
     */
    isAdmin?: boolean;
};

/* ---------------- Email Login ---------------- */

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

/* ---------------- Adapter (patched) ---------------- */

function createPatchedAdapter() {
    const base = PrismaAdapter(prisma) as any;
    return {
        ...base,
        async useVerificationToken(params: { identifier: string; token: string }) {
            try {
                if (typeof base.useVerificationToken !== "function") return null;
                return await base.useVerificationToken(params);
            } catch (err: unknown) {
                // ignore P2025 "record not found"
                if ((err as { code?: string })?.code === "P2025") return null;
                throw err;
            }
        },
        async deleteSession(sessionToken: string) {
            try {
                if (typeof base.deleteSession !== "function") return null;
                return await base.deleteSession(sessionToken);
            } catch (err: unknown) {
                if ((err as { code?: string })?.code === "P2025") return null;
                throw err;
            }
        },
    };
}

/* ---------------- Admin helpers ---------------- */

export function isAdminEmail(email?: string | null): boolean {
    if (!email) return false;
    const raw = process.env.ADMIN_EMAILS || "";
    const list: string[] = raw
        .split(",")
        .map((s: string) => s.trim().toLowerCase())
        .filter(Boolean);
    return list.includes(email.toLowerCase());
}

export function isAdminSession(session: Session | null | undefined): boolean {
    if (!session?.user) return false;
    const u = session.user as AppSessionUser;
    if (typeof u.isAdmin === "boolean") return u.isAdmin;
    if (u.role === "admin") return true;
    return isAdminEmail(u.email ?? null);
}

/** Use this everywhere instead of getServerSession(authOptions). */
export async function safeGetServerSession() {
    try {
        return await getServerSession(authOptions);
    } catch {
        if (process.env.NODE_ENV !== "production") {
            console.warn("[auth] safeGetServerSession(): returning null on error");
        }
        return null;
    }
}

/**
 * Strict admin gate for server components/actions.
 * If not admin → 404 (prevents discovery).
 * Returns { userId, email, isAdmin: true } when allowed.
 */
export async function requireAdminOrNotFound() {
    const session = await safeGetServerSession();
    if (!isAdminSession(session)) {
        // hide the existence of the route
        notFound();
    }
    const userId = (session!.user as { id: string }).id;
    const email = session!.user?.email ?? null;
    return { userId, email, isAdmin: true as const };
}

/** Backward-compat alias (older code may import `requireAdmin`). */
export async function requireAdmin() {
    return requireAdminOrNotFound();
}

/**
 * Non-throwing variant. Returns `null` if not admin.
 * Useful for admin-only UI branches without hard 404.
 */
export async function getAdminSession() {
    const session = await safeGetServerSession();
    if (!isAdminSession(session)) return null;
    return session as Session & { user: AppSessionUser };
}

/* ---------------- NextAuth Options ---------------- */

export const authOptions: NextAuthOptions = {
    adapter: createPatchedAdapter() as any,
    session: { strategy: "database" }, // DB sessions

    // Quiet noisy JWE logs; we handle null sessions via safe getter.
    logger: {
        error(code, metadata) {
            if (
                code === "JWT_SESSION_ERROR" ||
                code === "SESSION_ERROR" ||
                String(code).toLowerCase().includes("jwt") ||
                String(code).toLowerCase().includes("jwe")
            ) {
                if (process.env.NODE_ENV !== "production") {
                    console.warn("[next-auth] Ignored session decode error", metadata);
                }
                return;
            }
            console.error("[next-auth]", code, metadata);
        },
    },

    providers: [
        EmailProvider({
            maxAge: 10 * 60,
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
        async session({ session, user }: { session: Session; user: User }) {
            if (session.user) {
                const u = session.user as AppSessionUser;
                u.id = String(user.id);

                // Pull role & legacy flag from DB (user is Prisma User)
                const dbRole = (user as unknown as { role?: AppRole })?.role;
                const dbIsAdminFlag = Boolean(
                    (user as unknown as { isAdmin?: boolean })?.isAdmin
                );

                u.role = dbRole;
                u.isAdmin =
                    dbRole === "admin" || dbIsAdminFlag || isAdminEmail(user.email ?? null);
            }
            return session;
        },

        async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
            try {
                const u = new URL(url, baseUrl);
                if (u.origin === baseUrl) {
                    if (u.pathname === "/" || u.pathname.startsWith("/auth")) {
                        return "/dashboard";
                    }
                    return u.pathname + u.search + u.hash;
                }
            } catch {
                /* ignore */
            }
            return "/dashboard";
        },
    },

    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
};