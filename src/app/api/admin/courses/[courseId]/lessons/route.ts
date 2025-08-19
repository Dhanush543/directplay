

// src/app/api/admin/courses/[courseId]/lessons/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { safeGetServerSession } from "@/lib/auth";

// Helper: ensure the current user is an admin
async function requireAdmin() {
    const session = await safeGetServerSession();
    if (!session?.user?.id) return { ok: false as const, status: 401 as const, body: { error: "Unauthorized" } };
    const user = await prisma.user.findUnique({ where: { id: String(session.user.id) }, select: { isAdmin: true } as const });
    if (!user?.isAdmin) return { ok: false as const, status: 403 as const, body: { error: "Forbidden" } };
    return { ok: true as const };
}

// POST /api/admin/courses/:courseId/lessons
// Creates a new lesson for a course. If index is not provided, it will be appended to the end.
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
    // AuthZ
    const gate = await requireAdmin();
    if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status });

    const courseId = params.courseId;
    if (!courseId) return NextResponse.json({ error: "Missing courseId" }, { status: 400 });

    // Ensure course exists
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // Parse body
    let payload: { title?: unknown; index?: unknown; videoUrl?: unknown };
    try {
        payload = (await req.json()) as { title?: unknown; index?: unknown; videoUrl?: unknown };
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const titleRaw = payload.title;
    const indexRaw = payload.index;
    const videoUrlRaw = payload.videoUrl;

    // Validate
    if (typeof titleRaw !== "string" || !titleRaw.trim()) {
        return NextResponse.json({ error: "title is required" }, { status: 422 });
    }
    const title: string = titleRaw.trim();

    let index: number | undefined = undefined;
    if (typeof indexRaw !== "undefined") {
        const n = Number(indexRaw);
        if (!Number.isFinite(n) || n <= 0) {
            return NextResponse.json({ error: "index must be a positive integer" }, { status: 422 });
        }
        index = Math.floor(n);
    }

    let videoUrl: string | undefined = undefined;
    if (typeof videoUrlRaw !== "undefined" && videoUrlRaw !== null) {
        if (typeof videoUrlRaw !== "string") {
            return NextResponse.json({ error: "videoUrl must be a string" }, { status: 422 });
        }
        videoUrl = videoUrlRaw.trim();
    }

    // Compute default index (append) if not provided
    if (typeof index === "undefined") {
        const max = await prisma.lesson.aggregate({
            where: { courseId },
            _max: { index: true },
        });
        const maxIdx = max._max.index ?? 0;
        index = maxIdx + 1;
    }

    // Create lesson
    try {
        const lesson = await prisma.lesson.create({
            data: {
                courseId,
                index: index as number,
                title,
                videoUrl,
            },
            select: { id: true, courseId: true, index: true, title: true, videoUrl: true, createdAt: true, updatedAt: true },
        });
        return NextResponse.json(lesson, { status: 201 });
    } catch (err: unknown) {
        // Unique constraint on (courseId, index) could fail
        return NextResponse.json({ error: "Failed to create lesson" }, { status: 500 });
    }
}

export const dynamic = "force-dynamic"; // admin APIs should not be cached