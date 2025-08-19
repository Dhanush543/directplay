// src/app/api/lesson-progress/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET ?courseId=...&lessonId=...
 *  → { positionSeconds, completed, updatedAt }
 */
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | null)?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const courseId = String(searchParams.get("courseId") || "");
    const lessonId = String(searchParams.get("lessonId") || "");
    if (!courseId || !lessonId) {
        return new NextResponse("Missing courseId or lessonId", { status: 400 });
    }

    const row = await prisma.lessonProgress.findUnique({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        select: { durationSeconds: true, completed: true, updatedAt: true },
    });

    return NextResponse.json({
        positionSeconds: row?.durationSeconds ?? 0,
        completed: row?.completed ?? false,
        updatedAt: row?.updatedAt ?? null,
    });
}

/**
 * POST { courseId, lessonId, positionSeconds?, completed? }
 *  → Upserts LessonProgress
 *
 * Server guard:
 * - Always allow saving position.
 * - If `completed: true`, only allow when all *previous* lessons are completed.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | null)?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    let body: {
        courseId?: string;
        lessonId?: string;
        positionSeconds?: number;
        completed?: boolean;
    };
    try {
        body = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const courseId = String(body.courseId || "");
    const lessonId = String(body.lessonId || "");
    const positionSeconds = Math.max(0, Math.floor(Number(body.positionSeconds ?? 0)));
    const completedFlag = Boolean(body.completed);

    if (!courseId || !lessonId) {
        return new NextResponse("Missing courseId or lessonId", { status: 400 });
    }

    // Ensure the lesson exists & belongs to the course
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, index: true, courseId: true },
    });
    if (!lesson || lesson.courseId !== courseId) {
        return new NextResponse("Lesson not found for course", { status: 404 });
    }

    // Existing row (for idempotency and not regressing duration)
    const existing = await prisma.lessonProgress.findUnique({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        select: { durationSeconds: true, completed: true },
    });
    const nextDuration = existing
        ? Math.max(existing.durationSeconds, positionSeconds)
        : positionSeconds;

    // If trying to mark complete, enforce sequential rule
    if (completedFlag && !existing?.completed) {
        // collect all previous lesson IDs for this course
        const previousLessons = await prisma.lesson.findMany({
            where: { courseId, index: { lt: lesson.index } },
            select: { id: true },
        });

        // 👇 Fix: annotate the callback param or destructure
        const prevIds = previousLessons.map((l: { id: string }) => l.id);
        // // Alternative that also works:
        // const prevIds = previousLessons.map(({ id }) => id);

        // if there are previous lessons, ensure the user completed all of them
        if (prevIds.length > 0) {
            const completedPrevCount = await prisma.lessonProgress.count({
                where: {
                    userId,
                    courseId,
                    completed: true,
                    lessonId: { in: prevIds },
                },
            });
            if (completedPrevCount < prevIds.length) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "out_of_order",
                        message:
                            "You must complete previous lessons before marking this one complete.",
                    },
                    { status: 409 }
                );
            }
        }
    }

    const row = await prisma.lessonProgress.upsert({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        update: {
            durationSeconds: nextDuration,
            completed: existing?.completed || completedFlag,
        },
        create: {
            userId,
            courseId,
            lessonId,
            durationSeconds: nextDuration,
            completed: completedFlag,
        },
        select: { durationSeconds: true, completed: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, progress: row });
}