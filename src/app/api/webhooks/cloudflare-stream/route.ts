// src/app/api/webhooks/cloudflare-stream/route.ts
import { NextResponse } from "next/server";
import { auditStreamUploadDone } from "@/lib/stream";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        // Cloudflare sends various events; we only care for upload completed
        const uid: string | undefined = payload?.data?.uid || payload?.uid || payload?.video?.uid;
        const type: string | undefined = payload?.type || payload?.event;
        if (uid && /upload\.completed/i.test(type ?? "")) {
            await auditStreamUploadDone(uid, null);
        }
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 400 });
    }
}