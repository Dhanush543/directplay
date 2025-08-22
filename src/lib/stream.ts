// src/lib/stream.ts
import { writeAuditLog } from "@/lib/audit";

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID!;
const API_TOKEN = process.env.CLOUDFLARE_STREAM_API_TOKEN!;

if (!ACCOUNT_ID || !API_TOKEN) {
    // don't throw at import-time in dev, but fail loudly on use
    // eslint-disable-next-line no-console
    console.warn("[stream] Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_STREAM_API_TOKEN");
}

type DirectUploadResp = {
    result: {
        uid: string;
        uploadURL: string;
        thumbnail: string | null;
        status: { state: string };
    };
    success: boolean;
    errors?: any[];
};

export async function createDirectUpload(opts?: {
    // optional: limit size, allowed origins, etc.
    maxDurationSeconds?: number;
    watermark?: boolean;
    creatorUserId?: string | null;
}) {
    if (!ACCOUNT_ID || !API_TOKEN) throw new Error("Cloudflare Stream env not configured");

    const body: Record<string, any> = {
        // Signed upload with default behavior
        maxDurationSeconds: opts?.maxDurationSeconds ?? undefined,
    };

    const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/stream/direct_upload`,
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
            cache: "no-store",
        },
    );

    const json = (await res.json()) as DirectUploadResp;
    if (!res.ok || !json?.success) {
        throw new Error(`CF Stream: failed to create direct upload (${res.status})`);
    }
    return json.result; // { uid, uploadURL, ... }
}

/** Build a public HLS playback URL for a given Stream UID. */
export function hlsUrlFor(uid: string) {
    // Customer subdomain is optional. Generic domain works too:
    // https://videodelivery.net/{uid}/manifest/video.m3u8
    return `https://videodelivery.net/${uid}/manifest/video.m3u8`;
}

/** Optional: MP4 progressive */
export function mp4UrlFor(uid: string) {
    return `https://videodelivery.net/${uid}/downloads/default.mp4`;
}

/** Optional: called by webhook to log */
export async function auditStreamUploadDone(uid: string, userId?: string | null) {
    try {
        await writeAuditLog({
            action: "stream.upload.complete",
            entity: `stream:${uid}`,
            summary: `Cloudflare Stream upload completed (${uid})`,
            userId,
        });
    } catch {
        /* ignore */
    }
}