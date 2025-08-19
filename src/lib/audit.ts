import { prisma } from '@/lib/prisma';

export type AuditLogInput = {
    action: string;
    entity: string;
    summary: string;
    payload?: unknown;
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
            summary: string;
            userId: string | null;
            payload?: any;
        } = {
            action,
            entity,
            summary,
            userId: userId ?? null,
        };

        // Only set payload if provided; pass through raw object (do not stringify)
        if (typeof payload !== "undefined") {
            data.payload = payload as any;
        }

        await prisma.auditLog.create({ data });
    } catch (err) {
        console.error("Failed to write audit log", err);
    }
}
