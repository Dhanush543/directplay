// src/app/api/admin/users/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

/**
 * GET /api/admin/users
 * Query params:
 *  - q?: string        // search by email/name (insensitive)
 *  - page?: number     // 1-based
 *  - take?: number     // page size (default 20, max 100)
 *
 * Response: { items: Array&lt;UserRow&gt;, total: number, page: number, pages: number }
 */
export async function GET(req: NextRequest) {
    await requireAdminOrNotFound();

    const url = new URL(req.url);
    const qParam = url.searchParams.get("q") || "";
    const pageParam = url.searchParams.get("page") || "1";
    const takeParam = url.searchParams.get("take") || "20";

    const q: string = qParam.trim();
    const page: number = Math.max(1, Number.isFinite(Number(pageParam)) ? Number(pageParam) : 1);
    const takeRaw = Number(takeParam);
    const take: number = Math.min(100, Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 20));
    const skip: number = (page - 1) * take;

    const where = q
        ? {
            OR: [
                { email: { contains: q, mode: "insensitive" as const } },
                { name: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : {};

    type UserRow = {
        id: string;
        name: string | null;
        email: string | null;
        role: "user" | "admin";
        createdAt: Date;
        _count: { enrollments: number; lessonNotes: number };
    };

    const [items, total] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: { select: { enrollments: true, lessonNotes: true } },
            },
        }) as Promise<UserRow[]>,
        prisma.user.count({ where }),
    ]);

    const pages: number = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({ items, total, page, pages });
}

/**
 * PATCH /api/admin/users
 * Body:
 *  {
 *    "id": string,                 // required
 *    "role": "user" | "admin"      // required
 *  }
 *
 * Response: { id, email, role }
 */
export async function PATCH(req: NextRequest) {
    await requireAdminOrNotFound();

    type PatchBody = { id?: string; role?: "user" | "admin" };
    const body = (await req.json()) as PatchBody;

    const id: string | undefined = typeof body.id === "string" ? body.id : undefined;
    const role = body.role;

    if (!id) {
        return NextResponse.json({ error: "Missing 'id'." }, { status: 400 });
    }
    if (role !== "user" && role !== "admin") {
        return NextResponse.json({ error: "Invalid 'role'. Must be 'user' or 'admin'." }, { status: 400 });
    }

    const updated = await prisma.user.update({
        where: { id },
        data: {
            role,
            // For backward compatibility with old checks that use `isAdmin`
            isAdmin: role === "admin",
        },
        select: { id: true, email: true, role: true },
    });

    return NextResponse.json(updated);
}