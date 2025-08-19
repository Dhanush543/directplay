// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth gate + admin hardening headers (without changing existing behavior).
 * - Uses NextAuth middleware to protect authenticated areas per `config.matcher`.
 * - Adds `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store`
 *   for all `/admin` routes to keep them undiscoverable.
 * - Actual admin RBAC is enforced in server components/actions via `requireAdmin*()`.
 * - Optional IP allowlist for `/admin` when ENV `ADMIN_IP_ALLOWLIST` is set
 *   (comma-separated IPv4/IPv6 list). If set and the request IP is not listed,
 *   we return 404 to avoid discovery.
 */
export default withAuth(
    function middleware(req: NextRequest) {
        // Optional IP allowlist (only active if env is present)
        if (req.nextUrl.pathname.startsWith("/admin")) {
            const raw = process.env.ADMIN_IP_ALLOWLIST?.trim() ?? "";
            if (raw) {
                const allowed = raw
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                // Best-effort IP detection (Vercel/Node)
                const xfwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
                const ip = xfwd || (req as unknown as { ip?: string }).ip || "";
                if (ip && !allowed.includes(ip)) {
                    // Return a hard 404 to hide the admin surface
                    return new NextResponse("Not Found", { status: 404 });
                }
            }
        }

        const res = NextResponse.next();

        // Extra hardening for the Admin surface
        if (req.nextUrl.pathname.startsWith("/admin")) {
            res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
            res.headers.set("Cache-Control", "no-store");
        }

        return res;
    },
    {
        // Keep your current sign-in page
        pages: { signIn: "/auth?view=signin" },
        // We only ensure the user is signed in here; RBAC is server-side.
    }
);

// Protect authenticated areas of the app. Role checks happen in server code.
export const config = {
    matcher: [
        "/dashboard",
        "/dashboard/:path*",
        "/learn/:path*",
        "/notifications",
        "/admin/:path*",
    ],
};