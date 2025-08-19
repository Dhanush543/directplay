// src/app/api/admin/media/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrNotFound } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

/** Reuse S3 client builder for optional hard delete */
function s3() {
    const region = process.env.S3_REGION ?? "auto";
    const endpoint = process.env.S3_ENDPOINT || undefined;
    const credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    };
    return new S3Client({
        region,
        endpoint,
        forcePathStyle: Boolean(endpoint),
        credentials,
    });
}

/**
 * DELETE /api/admin/media/:id
 * - Soft delete by default (sets deletedAt)
 * - If query ?hard=1, performs hard delete:
 *     - deletes S3 object (best-effort)
 *     - deletes DB row
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    await requireAdminOrNotFound();
    const id = params.id;

    const urlObj = new URL(_req.url);
    const hard = urlObj.searchParams.get("hard") === "1";

    // Fetch record first
    const media = await prisma.media.findUnique({
        where: { id },
        select: { id: true, key: true, deletedAt: true },
    });
    if (!media) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Hard delete path
    if (hard) {
        const bucket = process.env.S3_BUCKET || "";

        // Best-effort object delete (only if we have bucket and key)
        if (bucket && media.key) {
            try {
                const client = s3();
                await client.send(
                    new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: media.key,
                    })
                );
            } catch (err) {
                // Don't fail DB deletion because of storage hiccup; just log.
                console.warn("[media hard delete] S3 delete failed", err);
            }
        }

        await prisma.media.delete({ where: { id } });
        return NextResponse.json({ ok: true, hardDeleted: true });
    }

    // Soft delete path
    if (!media.deletedAt) {
        await prisma.media.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }
    return NextResponse.json({ ok: true, softDeleted: true });
}