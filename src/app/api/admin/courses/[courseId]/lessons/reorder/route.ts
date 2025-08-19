// src/app/api/admin/courses/[courseId]/lessons/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { safeGetServerSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic"; // avoid caching

/*
  POST /api/admin/courses/:courseId/lessons/reorder
  Body: { lessonIds: string[] }  // desired order, first item becomes index=1
*/

async function requireAdmin() {
    const session = await safeGetServerSession();
    const user: { id: string; email?: string | null; isAdmin?: boolean } | undefined =
        session?.user as any;
    if (!user || !user.id || !user.isAdmin) {
        return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    return null;
}

export async function POST(
    req: NextRequest,
    context: { params: { courseId: string } }
) {
    const guard = await requireAdmin();
    if (guard) return guard;

    const { courseId } = context.params;

    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (
        !payload ||
        typeof payload !== "object" ||
        !Array.isArray((payload as any).lessonIds)
    ) {
        return NextResponse.json(
            { error: "Expected body: { lessonIds: string[] }" },
            { status: 400 }
        );
    }

    const lessonIds: string[] = (payload as { lessonIds: unknown }).lessonIds as string[];
    if (!lessonIds.length || lessonIds.some((id) => typeof id !== "string")) {
        return NextResponse.json(
            { error: "lessonIds must be a non-empty array of strings" },
            { status: 400 }
        );
    }

    // Fetch existing lessons for the course to validate membership & size
    const existing = await prisma.lesson.findMany({
        where: { courseId },
        select: { id: true },
    });

    const existingIds = new Set(existing.map((l: { id: string }) => l.id));

    if (existing.length !== lessonIds.length) {
        return NextResponse.json(
            { error: "lessonIds does not include all lessons for this course" },
            { status: 400 }
        );
    }

    for (const id of lessonIds) {
        if (!existingIds.has(id)) {
            return NextResponse.json(
                { error: `Lesson ${id} does not belong to this course` },
                { status: 400 }
            );
        }
    }

    // Apply new indices in a transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        for (let i = 0; i < lessonIds.length; i++) {
            const id = lessonIds[i]!;
            const index = i + 1; // 1-based
            await tx.lesson.update({ where: { id }, data: { index } });
        }
    });

    const updated = await prisma.lesson.findMany({
        where: { courseId },
        orderBy: { index: "asc" },
        select: { id: true, index: true, title: true, videoUrl: true },
    });

    return NextResponse.json({ ok: true, lessons: updated });
}
