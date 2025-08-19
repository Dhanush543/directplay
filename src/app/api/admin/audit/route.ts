// src/app/api/admin/audit/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { safeGetServerSession, isAdminSession } from "@/lib/auth";

/**
 * GET /api/admin/audit
 * Admin-only: list audit logs with basic filtering & pagination.
 * Query params:
 *  - q: string (matches action/entity/summary, case-insensitive)
 *  - page: number (default 1)
 *  - take: number (default 50, max 200)
 *
 * Returns:
 *  { items: [...], page, pages, total }
 */
export async function GET(req: NextRequest) {
    // Admin gate — return 404 to avoid discovery
    const session = await safeGetServerSession();
    if (!isAdminSession(session)) {
        return new NextResponse("Not found", { status: 404 });
    }

    const url = new URL(req.url);
    const q = url.searchParams.get("q") ?? "";
    const pageRaw = url.searchParams.get("page") ?? "1";
    const takeRaw = url.searchParams.get("take") ?? "50";

    const page = Math.max(1, Number.isFinite(Number(pageRaw)) ? Number(pageRaw) : 1);
    const takeUncapped = Number.isFinite(Number(takeRaw)) ? Number(takeRaw) : 50;
    const take = Math.min(200, Math.max(1, takeUncapped));
    const skip = (page - 1) * take;

    const hasQuery = q.trim().length > 0;

    const where = hasQuery
        ? {
            OR: [
                { action: { contains: q } },
                { entity: { contains: q } },
                { summary: { contains: q } },
            ],
        }
        : {};

    const [items, total] = await Promise.all([
        prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                action: true,
                entity: true,
                summary: true,
                payload: true,
                createdAt: true,
                actor: {
                    select: { id: true, email: true, name: true },
                },
            },
        }),
        prisma.auditLog.count({ where }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({
        items,
        page,
        pages,
        total,
    });
}