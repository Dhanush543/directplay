// src/app/notifications/actions.ts
"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/** Resolves the logged-in user id or throws */
async function requireUserId(): Promise<string> {
    const session = await getServerSession(authOptions);
    const id = (session?.user as { id?: string } | null)?.id;
    if (!id) throw new Error("Not authenticated");
    return id;
}

export async function markAllRead(): Promise<void> {
    const userId = await requireUserId();
    try {
        await prisma.notification.updateMany({
            where: { userId, read: false },
            data: { read: true },
        });
    } finally {
        // Refresh the notifications page and the layout (header) next render
        revalidatePath("/notifications");
        revalidatePath("/", "layout");
    }
}

export async function markOneRead(formData: FormData): Promise<void> {
    const userId = await requireUserId();
    const idRaw = formData.get("id");
    const id = typeof idRaw === "string" ? idRaw : "";

    if (!id) return;

    try {
        await prisma.notification.updateMany({
            where: { id, userId, read: false },
            data: { read: true },
        });
    } finally {
        revalidatePath("/notifications");
        revalidatePath("/", "layout");
    }
}