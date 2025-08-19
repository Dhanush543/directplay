

// src/app/api/admin/lessons/[lessonId]/route.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/**
 * PATCH  /api/admin/lessons/[lessonId]
 * DELETE /api/admin/lessons/[lessonId]
 *
 * Admin-only endpoints for updating and deleting lessons.
 * - PATCH supports: { title?: string, videoUrl?: string | null, index?: number }
 *   If `index` changes, reorders siblings within the same course inside a transaction.
 * - DELETE: removes the lesson and compacts indices for subsequent lessons.
 */

export async function PATCH(req: NextRequest, ctx: { params: { lessonId: string } }) {
    await requireAdmin();

    const { lessonId } = ctx.params;
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const title = (body as { title?: unknown }).title;
    const videoUrl = (body as { videoUrl?: unknown }).videoUrl;
    const indexRaw = (body as { index?: unknown }).index;

    // Load existing to know course and current index
    const existing = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, index: true },
    });
    if (!existing) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const updates: { title?: string; videoUrl?: string | null } = {};
    if (typeof title === "string") updates.title = title.trim();
    if (videoUrl === null || typeof videoUrl === "string") updates.videoUrl = videoUrl?.trim() ?? null;

    const wantsReindex = typeof indexRaw === "number" && Number.isFinite(indexRaw);

    if (wantsReindex) {
        const newIndex = Math.max(1, Math.floor(indexRaw as number));

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Determine bounds
            const maxIndex = await tx.lesson.count({ where: { courseId: existing.courseId } });
            const clamped = Math.max(1, Math.min(maxIndex, newIndex));

            // Only shift if changed
            if (clamped !== existing.index) {
                if (clamped < existing.index) {
                    // moving up: shift down those within [clamped, oldIndex-1]
                    await tx.lesson.updateMany({
                        where: {
                            courseId: existing.courseId,
                            index: { gte: clamped, lt: existing.index },
                        },
                        data: { index: { increment: 1 } },
                    });
                } else {
                    // moving down: shift up those within (oldIndex, clamped]
                    await tx.lesson.updateMany({
                        where: {
                            courseId: existing.courseId,
                            index: { gt: existing.index, lte: clamped },
                        },
                        data: { index: { decrement: 1 } },
                    });
                }
            }

            await tx.lesson.update({
                where: { id: lessonId },
                data: { ...updates, index: clamped },
            });
        });
    } else {
        // Simple update, no reordering
        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ ok: true });
        }
        await prisma.lesson.update({ where: { id: lessonId }, data: updates });
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: { lessonId: string } }) {
    await requireAdmin();

    const { lessonId } = ctx.params;

    // Need course + index to compact after delete
    const existing = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, courseId: true, index: true },
    });
    if (!existing) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.lesson.delete({ where: { id: lessonId } });
        // Re-pack indices following the deleted position
        await tx.lesson.updateMany({
            where: { courseId: existing.courseId, index: { gt: existing.index } },
            data: { index: { decrement: 1 } },
        });
    });

    return NextResponse.json({ ok: true });
}