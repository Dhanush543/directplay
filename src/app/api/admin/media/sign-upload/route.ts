

// src/app/api/admin/media/sign-upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost, PresignedPost } from "@aws-sdk/s3-presigned-post";
import { requireAdmin } from "@/lib/auth";

/**
 * Returns an S3-compatible presigned POST so the client can upload directly.
 * Works with AWS S3, Cloudflare R2, MinIO (via S3 API), etc.
 *
 * Env required:
 * - S3_BUCKET
 * - S3_REGION
 * - (optional) S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
 * - (optional) S3_ENDPOINT  (for R2/MinIO; e.g. https://<accountid>.r2.cloudflarestorage.com)
 * - (optional) S3_FORCE_PATH_STYLE = "true" | "false"
 * - (optional) S3_PUBLIC_BASE_URL  (to compute a CDN URL)
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    await requireAdmin();

    const env = getEnv();
    if (!env.S3_BUCKET || !env.S3_REGION) {
        return NextResponse.json(
            { error: "Missing S3 config. Set S3_BUCKET and S3_REGION (and credentials/endpoint if needed)." },
            { status: 500, headers: noStore() }
        );
    }

    let body: { filename?: string; contentType?: string; maxBytes?: number } = {};
    try {
        body = (await req.json()) as { filename?: string; contentType?: string; maxBytes?: number };
    } catch {
        // allow empty body; will error below if filename missing
    }

    const filename = (body.filename ?? "file").toString();
    const contentType = (body.contentType ?? "application/octet-stream").toString();
    const maxBytes = Number.isFinite(body.maxBytes) && Number(body.maxBytes) > 0 ? Number(body.maxBytes) : 100 * 1024 * 1024; // 100MB default

    const key = makeObjectKey(filename);

    const client = new S3Client({
        region: env.S3_REGION,
        endpoint: env.S3_ENDPOINT || undefined,
        forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
        credentials:
            env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY
                ? {
                    accessKeyId: env.S3_ACCESS_KEY_ID,
                    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
                }
                : undefined,
    });

    const post: PresignedPost = await createPresignedPost(client, {
        Bucket: env.S3_BUCKET,
        Key: key,
        Expires: 300, // seconds
        Conditions: [
            ["content-length-range", 0, maxBytes],
            ["starts-with", "$Content-Type", contentTypePrefix(contentType)],
        ],
        Fields: {
            "Content-Type": contentType,
        },
    });

    // Public URL if a CDN/base is configured (helpful for immediate previews)
    const publicUrl = env.S3_PUBLIC_BASE_URL ? joinUrl(env.S3_PUBLIC_BASE_URL, key) : null;

    return NextResponse.json(
        {
            uploadUrl: post.url,
            fields: post.fields,
            key,
            bucket: env.S3_BUCKET,
            region: env.S3_REGION,
            publicUrl,
            // include headers to use when uploading with fetch (if needed)
            method: "POST" as const,
        },
        { headers: noStore() }
    );
}

/* ---------------- helpers ---------------- */

function getEnv(): Record<string, string | undefined> {
    return {
        S3_BUCKET: process.env.S3_BUCKET,
        S3_REGION: process.env.S3_REGION,
        S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
        S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
        S3_ENDPOINT: process.env.S3_ENDPOINT,
        S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE,
        S3_PUBLIC_BASE_URL: process.env.S3_PUBLIC_BASE_URL,
    };
}

function sanitizeFilename(name: string): string {
    // keep extension if present
    const trimmed = name.trim().replace(/[\s]+/g, "-");
    return trimmed.replace(/[^a-zA-Z0-9.\-_]/g, "");
}

function makeObjectKey(originalName: string): string {
    const clean = sanitizeFilename(originalName || "file");
    const [base, ...extParts] = clean.split(".");
    const ext = extParts.length ? "." + extParts.pop() : "";
    const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const id = randomUUID();
    return `uploads/${stamp}/${base || "file"}-${id}${ext}`;
}

function contentTypePrefix(ct: string): string {
    // allow exact type or its top-level type (e.g., image/*)
    const i = ct.indexOf("/");
    return i > 0 ? ct.slice(0, i + 1) : "";
}

function joinUrl(base: string, key: string): string {
    const b = base.endsWith("/") ? base.slice(0, -1) : base;
    const k = key.startsWith("/") ? key.slice(1) : key;
    return `${b}/${k}`;
}

function noStore(): Record<string, string> {
    return {
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
    };
}