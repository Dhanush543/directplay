

// src/app/api/admin/courses/[courseId]/lessons/[lessonId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { safeGetServerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Params = {
    params: {
        courseId: string;
        lessonId: string;
    };
};

async function requireAdmin() {
    const session = await safeGetServerSession();
    if (!session?.user?.email) {
        return { ok: false as const, status: 401 as const, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, isAdmin: true },
    });
    if (!user || !user.isAdmin) {
        return { ok: false as const, status: 403 as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { ok: true as const };
}

async function loadLessonOr404(courseId: string, lessonId: string) {
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: {
            id: true,
            courseId: true,
            index: true,
            title: true,
            videoUrl: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!lesson || lesson.courseId !== courseId) {
        return null;
    }
    return lesson;
}

// GET /api/admin/courses/[courseId]/lessons/[lessonId]
export async function GET(_req: Request, { params }: Params) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { courseId, lessonId } = params;
    const lesson = await loadLessonOr404(courseId, lessonId);
    if (!lesson) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }
    return NextResponse.json(lesson);
}

// PATCH /api/admin/courses/[courseId]/lessons/[lessonId]
export async function PATCH(req: Request, { params }: Params) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { courseId, lessonId } = params;
    const existing = await loadLessonOr404(courseId, lessonId);
    if (!existing) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Validate fields
    type PatchBody = {
        title?: string;
        index?: number;
        videoUrl?: string | null;
    };
    const { title, index, videoUrl } = (body || {}) as PatchBody;

    const data: Record<string, unknown> = {};
    if (typeof title !== "undefined") {
        if (typeof title !== "string" || title.trim().length === 0) {
            return NextResponse.json({ error: "title must be a non-empty string" }, { status: 422 });
        }
        data.title = title.trim();
    }
    if (typeof index !== "undefined") {
        if (!Number.isInteger(index) || index < 1) {
            return NextResponse.json({ error: "index must be a positive integer (1-based)" }, { status: 422 });
        }
        data.index = index;
    }
    if (typeof videoUrl !== "undefined") {
        if (videoUrl !== null && typeof videoUrl !== "string") {
            return NextResponse.json({ error: "videoUrl must be a string or null" }, { status: 422 });
        }
        data.videoUrl = videoUrl;
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    try {
        // Ensure uniqueness on (courseId, index) if index is changing
        if (typeof data.index === "number" && data.index !== existing.index) {
            const clash = await prisma.lesson.findFirst({
                where: { courseId, index: data.index as number, NOT: { id: lessonId } },
                select: { id: true },
            });
            if (clash) {
                return NextResponse.json(
                    { error: `Another lesson already has index ${data.index} in this course` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.lesson.update({
            where: { id: lessonId },
            data,
            select: {
                id: true,
                courseId: true,
                index: true,
                title: true,
                videoUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updated);
    } catch (err) {
        console.error("[admin][PATCH lesson] failed", err);
        return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
    }
}

// DELETE /api/admin/courses/[courseId]/lessons/[lessonId]
export async function DELETE(_req: Request, { params }: Params) {
    const gate = await requireAdmin();
    if (!gate.ok) return gate.res;

    const { courseId, lessonId } = params;
    const existing = await loadLessonOr404(courseId, lessonId);
    if (!existing) {
        return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    try {
        await prisma.lesson.delete({ where: { id: lessonId } });
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("[admin][DELETE lesson] failed", err);
        return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
    }
}