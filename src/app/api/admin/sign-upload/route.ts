// src/app/api/admin/sign-upload/route.ts
import { NextResponse, NextRequest } from "next/server";
import { requireAdminOrNotFound } from "@/lib/auth";
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost, PresignedPostOptions } from "@aws-sdk/s3-presigned-post";

/** Build S3 client (supports AWS S3, R2, Minio via S3_ENDPOINT) */
function s3() {
    const region = process.env.S3_REGION ?? "auto";
    const endpoint = process.env.S3_ENDPOINT || undefined; // e.g. https://<accountid>.r2.cloudflarestorage.com
    const credentials = {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
    };
    return new S3Client({
        region,
        endpoint,
        forcePathStyle: Boolean(endpoint), // R2/Minio often require this
        credentials,
    });
}

export async function POST(req: NextRequest) {
    await requireAdminOrNotFound();

    const bucket = process.env.S3_BUCKET || "";
    if (!bucket) {
        return NextResponse.json({ error: "S3_BUCKET not configured" }, { status: 500 });
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { key, contentType, maxSizeBytes } = (body || {}) as {
        key?: string;
        contentType?: string;
        maxSizeBytes?: number;
    };

    if (!key || !contentType) {
        return NextResponse.json(
            { error: "Missing required fields: key, contentType" },
            { status: 400 }
        );
    }

    // Basic constraints; tweak as needed
    const conditions: NonNullable<PresignedPostOptions["Conditions"]> = [
        ["content-length-range", 0, Number(maxSizeBytes || 50 * 1024 * 1024)], // default 50MB
        ["starts-with", "$Content-Type", contentType.split(";")[0]],
        ["eq", "$key", key],
    ];

    try {
        const client = s3();
        const presigned = await createPresignedPost(client, {
            Bucket: bucket,
            Key: key,
            Conditions: conditions,
            Fields: {
                "Content-Type": contentType,
            },
            Expires: 60, // seconds
        });

        return NextResponse.json({
            uploadUrl: presigned.url,
            fields: presigned.fields,
            bucket,
            key,
            // Optional convenience public URL if you use a CDN/public base
            publicUrlBase: process.env.S3_PUBLIC_BASE_URL || null,
        });
    } catch (err) {
        console.error("[sign-upload] error", err);
        return NextResponse.json({ error: "Failed to create presigned POST" }, { status: 500 });
    }
}