//src/app/courses/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function requireUserId(): Promise<string> {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | null)?.id;
    if (!id) throw new Error("Not authenticated");
    return id;
}

export async function enroll(formData: FormData): Promise<void> {
    const userId = await requireUserId();
    const courseId = String(formData.get("courseId") ?? "");
    if (!courseId) return;

    // Upsert enrollment (idempotent)
    await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId },
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");
}

export async function unenroll(formData: FormData): Promise<void> {
    const userId = await requireUserId();
    const courseId = String(formData.get("courseId") ?? "");
    if (!courseId) return;

    await prisma.enrollment.deleteMany({
        where: { userId, courseId },
    });

    revalidatePath("/courses");
    revalidatePath("/dashboard");
}