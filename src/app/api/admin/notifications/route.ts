/* src/app/api/admin/notifications/route.ts */
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { Resend } from "resend";

/**
 * Admin-only Notifications API
 *
 * GET  /api/admin/notifications?userId=&type=&q=&page=1&take=20
 * POST /api/admin/notifications
 *    Single user:
 *      { userId: string, title: string, meta?: string, type?: "system" | "email" | "auth", sendEmail?: boolean }
 *    Broadcast (creates DB rows for many users; email sending is skipped for broadcasts):
 *      { all: true, title: string, meta?: string, type?: "system" | "email" | "auth" }
 */

type CreateBodySingle = {
    userId: string;
    title: string;
    meta?: string | null;
    type?: "system" | "email" | "auth";
    sendEmail?: boolean;
};

type CreateBodyBroadcast = {
    all: true;
    title: string;
    meta?: string | null;
    type?: "system" | "email" | "auth";
};

const resendApiKey = process.env.RESEND_API_KEY || "";
const defaultFrom = process.env.RESEND_FROM || "DirectPlay <send@directplay.in>";
const resend = new Resend(resendApiKey);

/* ----------------------------- GET: list/history ---------------------------- */
export async function GET(req: NextRequest) {
    await requireAdminOrNotFound();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const type = url.searchParams.get("type") as "system" | "email" | "auth" | null;
    const q = url.searchParams.get("q");
    const page = Math.max(1, Number(url.searchParams.get("page") || "1") || 1);
    const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") || "20") || 20));
    const skip = (page - 1) * take;

    const where = {
        ...(userId ? { userId } : {}),
        ...(type ? { type } : {}),
        ...(q
            ? {
                OR: [
                    { title: { contains: q } },
                    { meta: { contains: q } },
                ],
            }
            : {}),
        deletedAt: null,
    };

    const [rows, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                userId: true,
                title: true,
                meta: true,
                type: true,
                read: true,
                createdAt: true,
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.notification.count({ where }),
    ]);

    return NextResponse.json({ ok: true, page, take, total, rows });
}

/* ----------------------------- POST: create/send ---------------------------- */
export async function POST(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as Partial<CreateBodySingle & CreateBodyBroadcast>;

    if (b.all === true) {
        // Broadcast to many users (DB only; no email blast here)
        const title = String(b.title || "").trim();
        const meta = b.meta ? String(b.meta) : null;
        const type = (b.type as "system" | "email" | "auth") || "system";

        if (!title) {
            return NextResponse.json({ ok: false, error: "Title is required" }, { status: 400 });
        }

        // Fetch a reasonable chunk to avoid huge writes; can be expanded later with batching.
        const users: Array<{ id: string }> = await prisma.user.findMany({
            where: { deletedAt: null },
            select: { id: true },
            take: 1000,
        });

        if (users.length === 0) {
            return NextResponse.json({ ok: false, error: "No users to notify" }, { status: 404 });
        }

        // createMany for speed
        await prisma.notification.createMany({
            data: users.map((u) => ({
                userId: u.id,
                title,
                meta,
                type,
                read: false,
            })),
        });

        return NextResponse.json({
            ok: true,
            mode: "broadcast",
            count: users.length,
        });
    }

    // Single user notification
    const userId = typeof b.userId === "string" ? b.userId : "";
    const title = String(b.title || "").trim();
    const meta = b.meta ? String(b.meta) : null;
    const type = (b.type as "system" | "email" | "auth") || "system";
    const sendEmail = Boolean(b.sendEmail);

    if (!userId || !title) {
        return NextResponse.json(
            { ok: false, error: "userId and title are required" },
            { status: 400 }
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, deletedAt: true },
    });

    if (!user || user.deletedAt) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const created = await prisma.notification.create({
        data: {
            userId,
            title,
            meta,
            type,
            read: false,
        },
        select: {
            id: true,
            userId: true,
            title: true,
            meta: true,
            type: true,
            read: true,
            createdAt: true,
        },
    });

    // Optional email send (best-effort)
    if (sendEmail && type === "email" && resendApiKey && user.email) {
        try {
            await resend.emails.send({
                from: defaultFrom,
                to: user.email,
                subject: title,
                html: renderEmailHtml({ title, meta, userName: user.name ?? undefined }),
            });
        } catch {
            // Don’t fail the API if email send errors; consider logging to AuditLog later
        }
    }

    return NextResponse.json({ ok: true, notification: created });
}

/* --------------------------------- helpers --------------------------------- */
function renderEmailHtml(params: { title: string; meta: string | null; userName?: string }) {
    const greeting = params.userName ? `Hi ${escapeHtml(params.userName)},` : "Hi there,";
    const meta = params.meta ? `<p style="margin:0.5rem 0 0">${escapeHtml(params.meta)}</p>` : "";
    return `
  <div style="font-family:Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.6;color:#0f172a">
    <h2 style="margin:0 0 0.5rem">${escapeHtml(params.title)}</h2>
    <p style="margin:0">${greeting}</p>
    ${meta}
    <p style="margin:1rem 0 0;color:#64748b;font-size:12px">You received this notification from DirectPlay.</p>
  </div>`;
}

function escapeHtml(input: string) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}