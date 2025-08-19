

// src/app/api/admin/courses/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/courses
 * Query params:
 *  - q?: string (search in title/slug/level)
 *  - page?: number (default 1)
 *  - take?: number (default 20, max 100)
 */
export async function GET(req: NextRequest) {
    await requireAdminOrNotFound();

    const url = new URL(req.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const pageRaw = url.searchParams.get("page") ?? "1";
    const takeRaw = url.searchParams.get("take") ?? "20";

    const pageNum = Number(pageRaw);
    const takeNum = Number(takeRaw);
    const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
    const take = Number.isFinite(takeNum) ? Math.min(100, Math.max(1, takeNum)) : 20;
    const skip = (page - 1) * take;

    const where = q
        ? {
            OR: [
                { title: { contains: q, mode: "insensitive" as const } },
                { slug: { contains: q, mode: "insensitive" as const } },
                { level: { contains: q, mode: "insensitive" as const } },
            ],
        }
        : {};

    const [rows, total] = await Promise.all([
        prisma.course.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
                id: true,
                title: true,
                slug: true,
                level: true,
                durationHours: true,
                priceINR: true,
                published: true,
                comingSoon: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { lessons: true, enrollments: true } },
            },
        }),
        prisma.course.count({ where }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return NextResponse.json({ rows, total, page, pages, take });
}

/**
 * POST /api/admin/courses
 * Body: { title: string; slug: string; description?, level?, durationHours?, priceINR?, points?: string[] | string, ogImage?, previewPoster?, published?, comingSoon? }
 */
export async function POST(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    // Narrow the unknown body safely
    const data = (body ?? {}) as Record<string, unknown>;

    const title = String((data.title ?? "")).trim();
    const slug = String((data.slug ?? "")).trim();
    if (!title || !slug) {
        return new NextResponse("Title and slug are required", { status: 400 });
    }

    // Optional fields with normalization
    const description = data.description ? String(data.description) : null;
    const level = data.level ? String(data.level) : null;
    const durationHours = data.durationHours != null ? Number(data.durationHours) : null;
    const priceINR = data.priceINR != null ? Number(data.priceINR) : null;
    const ogImage = data.ogImage ? String(data.ogImage) : null;
    const previewPoster = data.previewPoster ? String(data.previewPoster) : null;
    const published = Boolean(data.published ?? false);
    const comingSoon = Boolean(data.comingSoon ?? true);

    // Points can be an array of strings or a newline string
    let points: string[] | null = null;
    const rawPoints = data.points as unknown;
    if (Array.isArray(rawPoints)) {
        points = rawPoints.map((v: unknown) => String(v)).filter((v: string) => v.length > 0);
    } else if (typeof rawPoints === "string") {
        points = rawPoints
            .split("\n")
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 0);
    }

    try {
        // Ensure slug is unique (give a friendly error instead of generic 500 on P2002)
        const exists = await prisma.course.findUnique({ where: { slug } });
        if (exists) return new NextResponse("Slug already exists", { status: 409 });

        const course = await prisma.course.create({
            data: {
                title,
                slug,
                description,
                level,
                durationHours,
                priceINR,
                ogImage,
                previewPoster,
                published,
                comingSoon,
                // Pass as any to be resilient across Prisma JSON TS versions
                points: (points ?? null) as any,
            },
            select: {
                id: true,
                title: true,
                slug: true,
                published: true,
                comingSoon: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(course, { status: 201 });
    } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === "P2002") {
            return new NextResponse("Unique constraint failed", { status: 409 });
        }
        console.error("[api/admin/courses] POST error", err);
        return new NextResponse("Internal error", { status: 500 });
    }
}