// src/lib/audit.ts
import prisma from "@/lib/prisma";

export type AuditLogInput = {
    action: string;
    entity: string;
    summary?: string | null;
    payload?: unknown;
    /** caller passes the current user id; we will store it as actorId */
    userId?: string | null;
};

export async function writeAuditLog({
    action,
    entity,
    summary,
    payload,
    userId,
}: AuditLogInput) {
    try {
        const data: {
            action: string;
            entity: string;
            summary?: string | null;
            actorId: string | null;
            payload?: unknown;
        } = {
            action,
            entity,
            summary: summary ?? null,
            actorId: userId ?? null, // 👈 correct column
        };

        if (typeof payload !== "undefined") {
            data.payload = payload;
        }

        await prisma.auditLog.create({ data });
    } catch (err) {
        // Keep this quiet in prod; surface in dev
        if (process.env.NODE_ENV !== "production") {
            console.error("[audit] Failed to write audit log", err);
        }
    }
}