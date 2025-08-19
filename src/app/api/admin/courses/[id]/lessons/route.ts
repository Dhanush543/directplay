import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// Create a lesson for a course (admin-only)
// Accepts JSON: { title: string; index?: number; videoUrl?: string | null }
// If `index` is provided (>=1), we insert at that position and shift others down.
// Otherwise we append to the end.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    await requireAdmin();

    const body = (await request.json()) as {
        title?: string;
        index?: number | null;
        videoUrl?: string | null;
    };

    const title = String(body?.title ?? "").trim();
    const requestedIndex = typeof body?.index === "number" ? body.index : null;
    const videoUrl = (body?.videoUrl ?? null) as string | null;

    if (!title) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const courseId = params.id;

    const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // If a valid index (>=1) is given, shift down items at/after that index and insert there.
        if (requestedIndex && Number.isFinite(requestedIndex) && requestedIndex > 0) {
            await tx.lesson.updateMany({
                where: { courseId, index: { gte: requestedIndex } },
                data: { index: { increment: 1 } },
            });
            return tx.lesson.create({
                data: {
                    courseId,
                    title,
                    index: requestedIndex,
                    videoUrl,
                },
            });
        }

        // Otherwise, append to the end (max index + 1)
        const count = await tx.lesson.count({ where: { courseId } });
        const nextIndex = count + 1;
        return tx.lesson.create({
            data: {
                courseId,
                title,
                index: nextIndex,
                videoUrl,
            },
        });
    });

    return NextResponse.json(created, { status: 201 });
}
