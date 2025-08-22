// src/app/api/admin/stream/direct-upload/route.ts
import { NextResponse } from "next/server";
import { requireAdminOrNotFound } from "@/lib/auth";
import { createDirectUpload } from "@/lib/stream";

export async function POST() {
    await requireAdminOrNotFound();
    try {
        const result = await createDirectUpload();
        // Send back the one-time upload URL + the final Stream UID
        return NextResponse.json({ ok: true, uploadURL: result.uploadURL, uid: result.uid });
    } catch (err: any) {
        return NextResponse.json({ ok: false, error: err?.message ?? "Failed" }, { status: 500 });
    }
}