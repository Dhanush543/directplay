// src/app/admin/courses/[id]/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

/** Parse a string (from FormData) to number or null */
function toInt(value: FormDataEntryValue | null): number | null {
    const s = (value ?? "").toString().trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
}

/** Parse checkbox-like booleans */
function toBool(value: FormDataEntryValue | null): boolean {
    const s = (value ?? "").toString().toLowerCase();
    return s === "on" || s === "true" || s === "1";
}

/**
 * Best-effort parser for the marketing `points` field.
 * Accepts JSON (e.g. ["A","B"]) or newline/comma separated text.
 */
function parsePoints(raw: string | null | undefined): string[] | null {
    if (!raw) return null;
    const text = raw.trim();
    if (!text) return null;
    try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
        /* fall through */
    }
    const parts = text
        .replace(/\r/g, "\n")
        .split(/\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    return parts.length ? parts : null;
}

// Ensure lesson indexes are compact (1..n) without gaps for a course.
async function normalizeLessonIndexes(tx: Prisma.TransactionClient, courseId: string): Promise<void> {
    // Fast, collision-free renumbering using a single SQL statement.
    // It sets indexes to ROW_NUMBER() over the current order for the given course.
    await tx.$executeRaw`
        UPDATE "Lesson" AS l
        SET "index" = sub.rn
        FROM (
            SELECT "id", ROW_NUMBER() OVER (ORDER BY "index", "id") AS rn
            FROM "Lesson"
            WHERE "courseId" = ${courseId}
        ) AS sub
        WHERE l."id" = sub."id";
    `;
}

async function flash(type: "success" | "error", message: string) {
    try {
        const jar = await cookies();
        await jar.set("flash", JSON.stringify({ type, message }), {
            path: "/",
            httpOnly: false,
            maxAge: 8,
        });
    } catch {
        // ignore if headers already sent / not available
    }
}

/* ------------------------------------------------------------------ */
/* Course actions                                                      */
/* ------------------------------------------------------------------ */

export async function updateCourseAction(formData: FormData) {
    const { userId } = await requireAdminOrNotFound();

    let id = String(formData.get("id") ?? "").trim();
    const slugFromForm = (formData.get("slug") ?? "").toString().trim();

    // If editing and hidden id wasn't included for some reason, resolve by slug (best-effort)
    if (!id && slugFromForm) {
        const viaSlug = await prisma.course.findUnique({
            where: { slug: slugFromForm },
            select: { id: true },
        });
        if (viaSlug?.id) {
            id = viaSlug.id;
        }
    }

    if (!id) throw new Error("Course id is required");

    const title = (formData.get("title") ?? "").toString().trim();
    const slug = (formData.get("slug") ?? "").toString().trim();
    const description = (formData.get("description") ?? "").toString().trim() || null;
    const level = (formData.get("level") ?? "").toString().trim() || null; // Beginner/Intermediate/Advanced
    const durationHours = toInt(formData.get("durationHours"));
    const priceINR = toInt(formData.get("priceINR"));
    const ogImage = (formData.get("ogImage") ?? "").toString().trim() || null;
    const previewPoster = (formData.get("previewPoster") ?? "").toString().trim() || null;
    const published = toBool(formData.get("published"));
    const comingSoon = toBool(formData.get("comingSoon"));
    const points = parsePoints((formData.get("points") ?? null) as string | null);

    if (!title) throw new Error("Title is required");
    if (!slug) throw new Error("Slug is required");

    const prev = await prisma.course.findUnique({
        where: { id },
        select: {
            title: true,
            slug: true,
            description: true,
            level: true,
            durationHours: true,
            priceINR: true,
            ogImage: true,
            previewPoster: true,
            published: true,
            comingSoon: true,
            points: true,
        },
    });

    let updated;
    try {
        updated = await prisma.course.update({
            where: { id },
            data: {
                title,
                slug,
                description,
                level,
                durationHours: durationHours ?? undefined,
                priceINR: priceINR ?? undefined,
                ogImage,
                previewPoster,
                published,
                comingSoon,
                // store null or an array explicitly; pass undefined to leave unchanged
                points: typeof points === "undefined" ? undefined : (points as any),
            },
            select: {
                title: true,
                slug: true,
                description: true,
                level: true,
                durationHours: true,
                priceINR: true,
                ogImage: true,
                previewPoster: true,
                published: true,
                comingSoon: true,
                points: true,
            },
        });
    } catch (err: any) {
        // Prisma unique constraint violation (e.g., slug already exists)
        if (err?.code === "P2002") {
            throw new Error("Slug must be unique. A course with this slug already exists.");
        }
        throw err;
    }

    // 📝 Audit with field-level changes
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (prev) {
        const keys = [
            "title",
            "slug",
            "description",
            "level",
            "durationHours",
            "priceINR",
            "ogImage",
            "previewPoster",
            "published",
            "comingSoon",
            "points",
        ] as const;
        for (const k of keys) {
            // stringify JSONish values for stable comparison
            const before = k === "points" ? JSON.stringify((prev as any)[k] ?? null) : (prev as any)[k];
            const after = k === "points" ? JSON.stringify((updated as any)[k] ?? null) : (updated as any)[k];
            if (before !== after) {
                changes[k] = { from: k === "points" ? JSON.parse(before as string) : before, to: k === "points" ? JSON.parse(after as string) : after };
            }
        }
    }

    const pubChange =
        prev && prev.published !== updated.published
            ? ` (published: ${String(prev.published)} → ${String(updated.published)})`
            : "";
    const csChange =
        prev && prev.comingSoon !== updated.comingSoon
            ? ` (comingSoon: ${String(prev.comingSoon)} → ${String(updated.comingSoon)})`
            : "";

    await writeAuditLog({
        action: "course.update",
        entity: `course:${id}`,
        summary: `Updated course "${updated.title}"${pubChange}${csChange}`,
        payload: { changes },
        userId,
    });

    revalidatePath(`/admin/courses/${id}`);
    revalidatePath("/admin/courses");
}

/* ------------------------------------------------------------------ */
/* Lesson actions                                                      */
/* ------------------------------------------------------------------ */

type LessonOrder = { id: string; index: number };

export async function createLessonAction(formData: FormData) {
    const { userId } = await requireAdminOrNotFound();

    const courseId = String(formData.get("courseId") ?? "").trim();
    const title = (formData.get("title") ?? "").toString().trim() || "Untitled Lesson";
    const videoUrlRaw = (formData.get("videoUrl") ?? "").toString().trim();
    const videoUrl = videoUrlRaw || null;
    const desiredIndex = toInt(formData.get("index"));

    if (!courseId) {
        await flash("error", "courseId is required");
        throw new Error("courseId is required");
    }

    try {
        // Do all ordering work in a single transaction so we never violate (courseId,index) uniqueness
        const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // How many lessons exist now?
            const total = await tx.lesson.count({ where: { courseId } });

            // If no explicit index, append to the end
            if (!desiredIndex) {
                const next = total + 1;
                const row = await tx.lesson.create({
                    data: { courseId, index: next, title, videoUrl },
                    select: { id: true, index: true },
                });
                // Defensive: make sure indexes are compact
                await normalizeLessonIndexes(tx, courseId);
                return row;
            }

            // Insert at a specific position (clamped to 1..total+1)
            const to = Math.max(1, Math.min(desiredIndex, total + 1));

            // Shift existing items at [to .. total] down by 1 while avoiding unique collisions
            const BUMP = 1_000_000;
            if (to <= total) {
                // Temporarily bump the block to a high range
                await tx.lesson.updateMany({
                    where: { courseId, index: { gte: to } },
                    data: { index: { increment: BUMP } },
                });
                // Bring them back with +1 net shift
                await tx.lesson.updateMany({
                    where: { courseId, index: { gte: to + BUMP } },
                    data: { index: { decrement: BUMP - 1 } },
                });
            }

            // Now there is a free slot at `to`
            const row = await tx.lesson.create({
                data: { courseId, index: to, title, videoUrl },
                select: { id: true, index: true },
            });

            // Compact indexes to be safe
            await normalizeLessonIndexes(tx, courseId);
            return row;
        });

        await writeAuditLog({
            action: "lesson.create",
            entity: `course:${courseId}`,
            summary: `Created lesson "${title}" at #${created.index}`,
            payload: { lessonId: created.id, index: created.index, videoUrl: !!videoUrl },
            userId,
        });

        await flash("success", `Lesson created at #${created.index}`);
        revalidatePath(`/admin/courses/${courseId}`);
        return created;
    } catch (err: any) {
        await flash("error", err?.message || "Failed to create lesson");
        revalidatePath(`/admin/courses/${courseId}`);
        throw err;
    }
}

export async function updateLessonAction(formData: FormData) {
    const { userId } = await requireAdminOrNotFound();

    try {
        const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
        const title = (formData.get("title") ?? "").toString().trim();
        const videoUrl = (formData.get("videoUrl") ?? "").toString().trim() || null;
        const nextIndex = toInt(formData.get("index"));

        if (!id) throw new Error("lessonId is required");

        const lesson = await prisma.lesson.findUnique({
            where: { id },
            select: { courseId: true, index: true, title: true },
        });
        if (!lesson) throw new Error("Lesson not found");

        await prisma.lesson.update({
            where: { id },
            data: {
                title: title || undefined,
                videoUrl,
                index: nextIndex ?? undefined,
            },
        });

        await writeAuditLog({
            action: "lesson.update",
            entity: `lesson:${id}`,
            summary: `Updated lesson "${title || lesson.title}"`,
            payload: { fromIndex: lesson.index, toIndex: nextIndex ?? lesson.index, videoUrl: !!videoUrl },
            userId,
        });

        await flash("success", "Lesson updated");
        revalidatePath(`/admin/courses/${lesson.courseId}`);
    } catch (err: any) {
        // Attempt to read courseId for revalidation if possible
        try {
            const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
            const l = id ? await prisma.lesson.findUnique({ where: { id }, select: { courseId: true } }) : null;
            if (l?.courseId) revalidatePath(`/admin/courses/${l.courseId}`);
        } catch { }
        await flash("error", err?.message || "Failed to update lesson");
        throw err;
    }
}

export async function deleteLessonAction(formData: FormData) {
    const { userId } = await requireAdminOrNotFound();

    try {
        const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
        if (!id) throw new Error("lessonId is required");

        // Do it all in one transaction: read -> delete -> compact indexes
        const { courseId, title, index } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const l = await tx.lesson.findUnique({
                where: { id },
                select: { courseId: true, title: true, index: true },
            });
            if (!l) throw new Error("Lesson not found");

            // Delete the lesson
            await tx.lesson.delete({ where: { id } });

            // Compact and fully normalize indexes to 1..n
            await normalizeLessonIndexes(tx, l.courseId);

            return l;
        });

        await writeAuditLog({
            action: "lesson.delete",
            entity: `lesson:${id}`,
            summary: `Deleted lesson "${title}" (#${index})`,
            payload: { courseId },
            userId,
        });

        await flash("success", "Lesson deleted");
        revalidatePath(`/admin/courses/${courseId}`);
    } catch (err: any) {
        await flash("error", err?.message || "Failed to delete lesson");
        // best-effort revalidate
        try {
            const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
            const l = id ? await prisma.lesson.findUnique({ where: { id }, select: { courseId: true } }) : null;
            if (l?.courseId) revalidatePath(`/admin/courses/${l.courseId}`);
        } catch { }
        throw err;
    }
}

/** Move lesson to a specific 1-based index within its course */
export async function moveLessonAction(formData: FormData) {
    const { userId } = await requireAdminOrNotFound();

    try {
        const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
        const targetIndexRaw = toInt(formData.get("targetIndex"));
        if (!id) throw new Error("lessonId is required");
        if (!targetIndexRaw || targetIndexRaw < 1) throw new Error("targetIndex must be >= 1");

        // Run the whole shuffle in a single transaction
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const lesson = await tx.lesson.findUnique({
                where: { id },
                select: { id: true, index: true, courseId: true, title: true },
            });
            if (!lesson) throw new Error("Lesson not found");

            // Clamp the requested index to the valid range [1..total]
            const total = await tx.lesson.count({ where: { courseId: lesson.courseId } });
            const to = Math.max(1, Math.min(targetIndexRaw, total));
            const from = lesson.index;

            if (from === to) {
                return { courseId: lesson.courseId, from, to, title: lesson.title };
            }

            // 1) Park the moving lesson at index 0 to avoid unique collisions
            await tx.lesson.update({ where: { id }, data: { index: 0 } });

            // 2) Shift neighbors using a big temporary bump to guarantee no collisions
            const BUMP = 1_000_000; // large enough separation

            if (to < from) {
                // Moving up: temporarily bump [to .. from-1] by +BUMP, then bring them back net +1
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gte: to, lt: from } },
                    data: { index: { increment: BUMP } },
                });
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gte: to + BUMP, lt: from + BUMP } },
                    data: { index: { decrement: BUMP - 1 } }, // net effect: +1
                });
            } else {
                // Moving down: temporarily bump (from+1 .. to] by -BUMP, then bring them back net -1
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gt: from, lte: to } },
                    data: { index: { decrement: BUMP } },
                });
                await tx.lesson.updateMany({
                    where: { courseId: lesson.courseId, index: { gt: from - BUMP, lte: to - BUMP } },
                    data: { index: { increment: BUMP - 1 } }, // net effect: -1
                });
            }

            // 3) Drop the moving lesson into its final slot
            await tx.lesson.update({ where: { id }, data: { index: to } });

            // Ensure resulting order is compact (defensive)
            await normalizeLessonIndexes(tx, lesson.courseId);

            return { courseId: lesson.courseId, from, to, title: lesson.title };
        });

        // Audit + flash and revalidate
        await writeAuditLog({
            action: "lesson.move",
            entity: `lesson:${id}`,
            summary: `Moved lesson "${result.title}"`,
            payload: { fromIndex: result.from, toIndex: result.to, courseId: result.courseId },
            userId,
        });

        await flash("success", `Lesson moved to #${result.to}`);
        revalidatePath(`/admin/courses/${result.courseId}`);
    } catch (err: any) {
        // Best-effort revalidation using whatever we can derive
        try {
            const id = String(formData.get("lessonId") ?? formData.get("id") ?? "").trim();
            const l = id ? await prisma.lesson.findUnique({ where: { id }, select: { courseId: true } }) : null;
            if (l?.courseId) revalidatePath(`/admin/courses/${l.courseId}`);
        } catch { }
        await flash("error", err?.message || "Failed to move lesson");
        throw err;
    }
}