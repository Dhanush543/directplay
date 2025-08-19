

// src/app/api/admin/courses/[id]/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function parsePoints(input: unknown): string[] | null {
    if (input == null) return null;
    if (Array.isArray(input)) return input.map((v) => String(v));
    const s = String(input);
    try {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) return arr.map((v) => String(v));
    } catch {
        /* not JSON */
    }
    return s
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
}

async function findCourseId(idOrSlug: string): Promise<string | null> {
    const found = await prisma.course.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: { id: true },
    });
    return found?.id ?? null;
}

function sanitizeCourseUpdate(body: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (typeof body.title === "string") out.title = body.title.trim();
    if (typeof body.slug === "string") out.slug = body.slug.trim();
    if (typeof body.description === "string") out.description = body.description.trim() || null;
    if (typeof body.level === "string") out.level = body.level.trim() || null;

    if (body.durationHours !== undefined) {
        const num = Number(body.durationHours);
        out.durationHours = Number.isFinite(num) ? num : null;
    }
    if (body.priceINR !== undefined) {
        const num = Number(body.priceINR);
        out.priceINR = Number.isFinite(num) ? num : null;
    }

    if (typeof body.previewPoster === "string") out.previewPoster = body.previewPoster.trim() || null;
    if (typeof body.ogImage === "string") out.ogImage = body.ogImage.trim() || null;

    if (body.published !== undefined) out.published = Boolean(body.published);
    if (body.comingSoon !== undefined) out.comingSoon = Boolean(body.comingSoon);

    if (body.points !== undefined) out.points = (parsePoints(body.points) ?? null) as any; // Prisma JSON compat

    return out;
}

function revalidateAfterChange(slugOrId: string) {
    try {
        revalidatePath("/admin/courses");
        revalidatePath(`/admin/courses/${slugOrId}`);
        revalidatePath("/courses");
        revalidatePath(`/learn/${slugOrId}`);
    } catch {
        // best-effort; ignore in API
    }
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
    await requireAdminOrNotFound();
    const idOrSlug = ctx.params.id;
    const course = await prisma.course.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            durationHours: true,
            priceINR: true,
            points: true,
            ogImage: true,
            previewPoster: true,
            published: true,
            comingSoon: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { lessons: true, enrollments: true } },
            lessons: { orderBy: { index: "asc" }, select: { id: true, index: true, title: true, videoUrl: true } },
        },
    });
    if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(course);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
    await requireAdminOrNotFound();
    const id = await findCourseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const data = sanitizeCourseUpdate(body);

    if (data.title === "" || data.slug === "") {
        return NextResponse.json({ error: "Title and slug are required" }, { status: 400 });
    }
    if (typeof data.slug === "string") {
        const exists = await prisma.course.findFirst({ where: { slug: data.slug, NOT: { id } }, select: { id: true } });
        if (exists) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const updated = await prisma.course.update({ where: { id }, data });
    revalidateAfterChange(updated.slug);
    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
    await requireAdminOrNotFound();
    const id = await findCourseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = (await req.json()) as Record<string, unknown>;
    const data = sanitizeCourseUpdate(body);

    if (Object.prototype.hasOwnProperty.call(data, "slug") && typeof data.slug === "string") {
        const exists = await prisma.course.findFirst({ where: { slug: data.slug, NOT: { id } }, select: { id: true } });
        if (exists) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const updated = await prisma.course.update({ where: { id }, data });
    revalidateAfterChange(updated.slug);
    return NextResponse.json({ ok: true, id: updated.id, slug: updated.slug });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
    await requireAdminOrNotFound();
    const id = await findCourseId(ctx.params.id);
    if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.course.delete({ where: { id } });
    revalidateAfterChange(ctx.params.id);
    return NextResponse.json({ ok: true });
}