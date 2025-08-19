// src/app/api/admin/media/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

/**
 * Create a Media record after upload is complete.
 * Body JSON:
 * {
 *   kind: "image" | "video" | "other",  // kind is one of "image" | "video" | "other"
 *   key: string,              // required if url is not provided
 *   url?: string | null,      // optional CDN/public URL
 *   mime?: string | null,
 *   width?: number | null,
 *   height?: number | null,
 *   sizeBytes?: number | null,
 *   courseId?: string | null,
 *   lessonId?: string | null,
 *   userId?: string | null
 * }
 */
export async function POST(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const {
        kind = "other",
        key,
        url = null,
        mime = null,
        width = null,
        height = null,
        sizeBytes = null,
        courseId = null,
        lessonId = null,
        userId = null,
    } = (body || {}) as {
        kind?: string;
        key?: string;
        url?: string | null;
        mime?: string | null;
        width?: number | null;
        height?: number | null;
        sizeBytes?: number | null;
        courseId?: string | null;
        lessonId?: string | null;
        userId?: string | null;
    };

    const safeKind = ((): "image" | "video" | "other" => {
        const k = String(kind || "other").toLowerCase();
        return k === "image" || k === "video" ? (k as any) : "other";
    })();

    if (!key && !url) {
        return NextResponse.json(
            { error: "Provide at least 'key' or 'url'." },
            { status: 400 }
        );
    }

    try {
        const created = await prisma.media.create({
            data: {
                kind: safeKind,
                key: key || (url as string),
                url,
                mime,
                width: width ?? null,
                height: height ?? null,
                sizeBytes: sizeBytes ?? null,
                courseId,
                lessonId,
                userId,
            },
            select: {
                id: true,
                kind: true,
                key: true,
                url: true,
                mime: true,
                width: true,
                height: true,
                sizeBytes: true,
                courseId: true,
                lessonId: true,
                userId: true,
                createdAt: true,
            },
        });

        return NextResponse.json({ ok: true, media: created });
    } catch (err) {
        console.error("[media POST] error", err);
        return NextResponse.json({ error: "Failed to create media" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await requireAdminOrNotFound();

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { id, ids } = (body || {}) as { id?: string; ids?: string[] };
    const list: string[] = Array.isArray(ids)
        ? ids.filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : (typeof id === "string" && id.trim().length > 0 ? [id] : []);

    if (list.length === 0) {
        return NextResponse.json({ error: "Provide 'id' (string) or 'ids' (string[])" }, { status: 400 });
    }

    try {
        const result = await prisma.media.updateMany({
            where: { id: { in: list }, deletedAt: null },
            data: { deletedAt: new Date() },
        });
        return NextResponse.json({ ok: true, count: result.count });
    } catch (err) {
        console.error("[media DELETE] error", err);
        return NextResponse.json({ error: "Failed to delete media" }, { status: 500 });
    }
}