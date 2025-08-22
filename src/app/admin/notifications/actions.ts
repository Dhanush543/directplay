// src/app/admin/notifications/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createNotificationAction(formData: FormData) {
    await requireAdminOrNotFound();

    const userIdRaw = String(formData.get("userId") ?? "").trim();
    const emailRaw = String(formData.get("email") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();
    const type = String(formData.get("type") ?? "system").trim() as
        | "system"
        | "email"
        | "auth";
    const meta = String(formData.get("meta") ?? "").trim() || null;

    if (!title) throw new Error("Title is required.");

    let userId = userIdRaw || "";
    if (emailRaw) {
        const user = await prisma.user.findFirst({
            where: { email: emailRaw },
            select: { id: true },
        });
        if (!user) throw new Error("No user found with that email.");
        userId = user.id;
    }
    if (!userId) throw new Error("Pick a user (by ID or Email).");

    await prisma.notification.create({
        data: { userId, title, type, meta },
    });

    revalidatePath("/admin/notifications");
}

export async function deleteNotificationAction(formData: FormData) {
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Notification id is required.");

    await prisma.notification.delete({ where: { id } });
    revalidatePath("/admin/notifications");
}

export async function toggleReadAction(formData: FormData) {
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    const nextRead = String(formData.get("nextRead") ?? "false") === "true";
    if (!id) throw new Error("Notification id is required.");

    await prisma.notification.update({
        where: { id },
        data: { read: nextRead },
    });
    revalidatePath("/admin/notifications");
}