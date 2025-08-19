// src/app/api/admin/enrollments/route.ts
import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

/**
 * Admin-only Enrollments API
 *
 * GET    /api/admin/enrollments?userId=&courseId=&page=1&take=20
 * POST   /api/admin/enrollments   { userId: string, courseId: string }
 * DELETE /api/admin/enrollments   { id?: string } | { userId: string, courseId: string }
 *
 * Notes:
 * - Soft-deletes are not used for enrollments (hard delete by design).
 * - Unique constraint on (userId, courseId) is enforced in the DB.
 */

type CreateBody = { userId: string; courseId: string };
type DeleteBody =
    | { id: string }
    | { userId: string; courseId: string };

export async function GET(req: NextRequest) {
    await requireAdminOrNotFound();

    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const courseId = url.searchParams.get("courseId");
    const pageParam = url.searchParams.get("page");
    const takeParam = url.searchParams.get("take");

    const page = Math.max(1, Number(pageParam ?? "1") || 1);
    const take = Math.min(100, Math.max(1, Number(takeParam ?? "20") || 20));
    const skip = (page - 1) * take;

    const where = {
        ...(userId ? { userId } : null),
        ...(courseId ? { courseId } : null),
    } as { userId?: string; courseId?: string };

    const [rows, total] = await Promise.all([
        prisma.enrollment.findMany({
            where,
            orderBy: { startedAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                startedAt: true,
                userId: true,
                courseId: true,
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        }),
        prisma.enrollment.count({ where }),
    ]);

    return NextResponse.json({
        ok: true,
        page,
        take,
        total,
        rows,
    });
}

export async function POST(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const { userId, courseId } = (body ?? {}) as Partial<CreateBody>;

    if (!userId || !courseId) {
        return NextResponse.json(
            { ok: false, error: "userId and courseId are required" },
            { status: 400 }
        );
    }

    // Ensure both exist (clearer error messages)
    const [user, course] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
        prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    ]);

    if (!user) {
        return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }
    if (!course) {
        return NextResponse.json({ ok: false, error: "Course not found" }, { status: 404 });
    }

    try {
        const created = await prisma.enrollment.create({
            data: { userId, courseId },
            select: {
                id: true,
                startedAt: true,
                userId: true,
                courseId: true,
            },
        });
        return NextResponse.json({ ok: true, enrollment: created });
    } catch (err: unknown) {
        // P2002 unique constraint violation (already enrolled)
        const code = (err as { code?: string })?.code;
        if (code === "P2002") {
            return NextResponse.json(
                { ok: false, error: "Enrollment already exists" },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { ok: false, error: "Failed to create enrollment" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const b = body as DeleteBody;

    try {
        if ("id" in b && typeof b.id === "string" && b.id.length > 0) {
            const deleted = await prisma.enrollment.delete({
                where: { id: b.id },
                select: { id: true },
            });
            return NextResponse.json({ ok: true, count: 1, deleted });
        }

        if (
            "userId" in b &&
            "courseId" in b &&
            typeof b.userId === "string" &&
            typeof b.courseId === "string" &&
            b.userId.length > 0 &&
            b.courseId.length > 0
        ) {
            // Delete by composite unique fields
            const deleted = await prisma.enrollment.delete({
                where: { userId_courseId: { userId: b.userId, courseId: b.courseId } },
                select: { id: true },
            });
            return NextResponse.json({ ok: true, count: 1, deleted });
        }

        return NextResponse.json(
            {
                ok: false,
                error: "Provide either { id } or { userId, courseId }",
            },
            { status: 400 }
        );
    } catch (err: unknown) {
        const code = (err as { code?: string })?.code;
        if (code === "P2025") {
            return NextResponse.json(
                { ok: false, error: "Enrollment not found" },
                { status: 404 }
            );
        }
        return NextResponse.json(
            { ok: false, error: "Failed to delete enrollment" },
            { status: 500 }
        );
    }
}