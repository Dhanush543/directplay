// src/app/admin/courses/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

/* ---------------- internal helpers ---------------- */

function parsePoints(input: string | null | undefined): string[] | null {
    if (!input) return null;
    try {
        const arr = JSON.parse(input);
        if (Array.isArray(arr)) return arr.map(String);
    } catch {
        return input
            .split("\n")
            .map((s: string) => s.trim())
            .filter(Boolean);
    }
    return null;
}

async function revalidateAll(courseSlugOrId: string) {
    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseSlugOrId}`);
    revalidatePath("/courses");
    revalidatePath(`/learn/${courseSlugOrId}`);
}

/* ---------------- exported server actions ---------------- */

export async function updateCourseAction(formData: FormData) {
    await requireAdminOrNotFound();

    const id = String(formData.get("courseId") ?? "");
    const currentSlug = String(formData.get("currentSlug") ?? "");

    const title = String(formData.get("title") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim() || null;
    const level = String(formData.get("level") ?? "").trim() || null;
    const durationHours = formData.get("durationHours");
    const priceINR = formData.get("priceINR");
    const previewPoster = String(formData.get("previewPoster") ?? "").trim() || null;
    const ogImage = String(formData.get("ogImage") ?? "").trim() || null;
    const published = formData.get("published") === "on";
    const comingSoon = formData.get("comingSoon") === "on";
    const pointsRaw = String(formData.get("points") ?? "");
    const points = parsePoints(pointsRaw);

    if (!id) throw new Error("Missing course id");
    if (!title) throw new Error("Title is required");
    if (!slug) throw new Error("Slug is required");

    // ensure slug uniqueness (except this course)
    const existing = await prisma.course.findFirst({
        where: { slug, NOT: { id } },
        select: { id: true },
    });
    if (existing) throw new Error("Slug is already in use");

    await prisma.course.update({
        where: { id },
        data: {
            title,
            slug,
            description,
            level,
            durationHours: durationHours ? Number(durationHours) : null,
            priceINR: priceINR ? Number(priceINR) : null,
            previewPoster,
            ogImage,
            published,
            comingSoon,
            // keep TS-compatible across Prisma versions
            points: (points ?? null) as any,
        },
    });

    await revalidateAll(slug);

    // if slug changed, redirect to the new URL
    if (slug && currentSlug && slug !== currentSlug) {
        redirect(`/admin/courses/${slug}`);
    }
}

export async function createLessonAction(formData: FormData) {
    await requireAdminOrNotFound();

    const courseId = String(formData.get("courseId") ?? "");
    const title = String(formData.get("lessonTitle") ?? "").trim();
    const index = Number(formData.get("lessonIndex") ?? 1);
    const videoUrl = String(formData.get("lessonVideoUrl") ?? "").trim() || null;

    if (!courseId) throw new Error("Missing course id");
    if (!title) throw new Error("Lesson title is required");
    if (!Number.isFinite(index) || index < 1) throw new Error("Index must be >= 1");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.lesson.updateMany({
            where: { courseId, index: { gte: index } },
            data: { index: { increment: 1 } },
        });
        await tx.lesson.create({
            data: { courseId, title, index, videoUrl },
        });
    });

    // need slug for revalidate; fetch it once
    const c = await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    await revalidateAll(c?.slug ?? courseId);
}

export async function updateLessonAction(formData: FormData) {
    await requireAdminOrNotFound();

    const lessonId = String(formData.get("id") ?? "");
    const title = String(formData.get("title") ?? "").trim();
    const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
    const indexRaw = formData.get("index");
    const newIndex = indexRaw ? Number(indexRaw) : null;

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, index: true, courseId: true },
    });
    if (!lesson) throw new Error("Invalid lesson");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        if (newIndex && newIndex !== lesson.index) {
            if (newIndex < 1) throw new Error("Index must be >= 1");
            const maxIndex = (await tx.lesson.count({ where: { courseId: lesson.courseId } })) || 0;
            const clamped = Math.max(1, Math.min(maxIndex, newIndex));

            if (clamped < lesson.index) {
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gte: clamped, lt: lesson.index } },
                    data: { index: { increment: 1 } },
                });
            } else if (clamped > lesson.index) {
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gt: lesson.index, lte: clamped } },
                    data: { index: { decrement: 1 } },
                });
            }

            await tx.lesson.update({
                where: { id: lessonId },
                data: { index: clamped, title, videoUrl },
            });
        } else {
            await tx.lesson.update({
                where: { id: lessonId },
                data: { title, videoUrl },
            });
        }
    });

    const c = await prisma.course.findUnique({ where: { id: lesson.courseId }, select: { slug: true } });
    await revalidateAll(c?.slug ?? lesson.courseId);
}

export async function deleteLessonAction(formData: FormData) {
    await requireAdminOrNotFound();

    const lessonId = String(formData.get("id") ?? "");
    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, index: true, courseId: true },
    });
    if (!lesson) throw new Error("Invalid lesson");

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.lesson.delete({ where: { id: lessonId } });
        await tx.lesson.updateMany({
            where: { courseId: lesson.courseId, index: { gt: lesson.index } },
            data: { index: { decrement: 1 } },
        });
    });

    const c = await prisma.course.findUnique({ where: { id: lesson.courseId }, select: { slug: true } });
    await revalidateAll(c?.slug ?? lesson.courseId);
}

export async function moveLessonAction(formData: FormData) {
    await requireAdminOrNotFound();

    const lessonId = String(formData.get("id") ?? "");
    const dir = String(formData.get("dir") ?? "up"); // "up" | "down"

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { id: true, index: true, courseId: true },
    });
    if (!lesson) throw new Error("Invalid lesson");

    const maxIndex = (await prisma.lesson.count({ where: { courseId: lesson.courseId } })) || 0;

    if (dir === "up" && lesson.index <= 1) return;
    if (dir === "down" && lesson.index >= maxIndex) return;

    const swapWithIndex = dir === "up" ? lesson.index - 1 : lesson.index + 1;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        const other = await tx.lesson.findFirst({
            where: { courseId: lesson.courseId, index: swapWithIndex },
            select: { id: true },
        });
        if (!other) return;

        await tx.lesson.update({
            where: { id: other.id },
            data: { index: lesson.index },
        });
        await tx.lesson.update({
            where: { id: lesson.id },
            data: { index: swapWithIndex },
        });
    });

    const c = await prisma.course.findUnique({ where: { id: lesson.courseId }, select: { slug: true } });
    await revalidateAll(c?.slug ?? lesson.courseId);
}