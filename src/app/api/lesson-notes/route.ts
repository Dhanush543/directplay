// src/app/api/lesson-notes/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/lesson-notes?courseId=...&lessonId=...
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

    const note = await prisma.lessonNote.findUnique({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        select: { content: true, updatedAt: true },
    });

    return NextResponse.json({
        content: note?.content ?? "",
        updatedAt: note?.updatedAt ?? null,
    });
}

// POST { courseId, lessonId, content }
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | null)?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    let payload: { courseId?: string; lessonId?: string; content?: string };
    try {
        payload = await req.json();
    } catch {
        return new NextResponse("Invalid JSON", { status: 400 });
    }

    const courseId = String(payload.courseId || "");
    const lessonId = String(payload.lessonId || "");
    const content = String(payload.content ?? "");
    if (!courseId || !lessonId) {
        return new NextResponse("Missing courseId or lessonId", { status: 400 });
    }

    const note = await prisma.lessonNote.upsert({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        update: { content },
        create: { userId, courseId, lessonId, content },
        select: { id: true, updatedAt: true },
    });

    return NextResponse.json({ ok: true, note });
}