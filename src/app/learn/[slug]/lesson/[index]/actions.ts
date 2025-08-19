//src/app/learn/[slug]/lesson/[index]/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUserId(): Promise<string> {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string })?.id;
    if (!id) throw new Error("Not authenticated");
    return id;
}

export async function saveNote(formData: FormData) {
    const userId = await requireUserId();
    const lessonId = String(formData.get("lessonId") || "");
    const courseId = String(formData.get("courseId") || "");
    const content = String(formData.get("content") || "");

    if (!lessonId || !courseId) return;

    await prisma.lessonNote.upsert({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        update: { content },
        create: { userId, courseId, lessonId, content },
    });

    revalidatePath(`/learn`); // safe broad revalidate
}

export async function markCompleted(formData: FormData) {
    const userId = await requireUserId();
    const lessonId = String(formData.get("lessonId") || "");
    const courseId = String(formData.get("courseId") || "");

    if (!lessonId || !courseId) return;

    // ensure row exists & mark complete
    await prisma.lessonProgress.upsert({
        where: { userId_courseId_lessonId: { userId, courseId, lessonId } },
        update: { completed: true },
        create: { userId, courseId, lessonId, completed: true, durationSeconds: 0 },
    });

    revalidatePath(`/learn`);
}