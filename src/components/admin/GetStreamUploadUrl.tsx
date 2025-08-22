//src/components/admin/GetStreamUploadUrl.tsx
"use client";

import * as React from "react";

export default function GetStreamUploadUrl({
    onUid,
}: { onUid?: (uid: string) => void }) {
    const [busy, setBusy] = React.useState(false);
    const [url, setUrl] = React.useState<string | null>(null);
    const [uid, setUid] = React.useState<string | null>(null);
    const [err, setErr] = React.useState<string | null>(null);

    async function create() {
        setBusy(true);
        setErr(null);
        setUrl(null);
        setUid(null);
        try {
            const res = await fetch("/api/admin/stream/direct-upload", { method: "POST" });
            const j = await res.json();
            if (!res.ok || !j?.ok) throw new Error(j?.error || "Failed");
            setUrl(j.uploadURL);
            setUid(j.uid);
            onUid?.(j.uid);
        } catch (e: any) {
            setErr(e?.message || "Failed to create upload URL");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                disabled={busy}
                onClick={create}
                className="rounded-md bg-indigo-600 text-white px-3 py-1.5 text-sm hover:bg-indigo-700 disabled:opacity-60"
            >
                {busy ? "Creating…" : "Get upload URL"}
            </button>
            {err && <div className="text-xs text-red-600">{err}</div>}
            {url && (
                <div className="text-xs">
                    <div className="font-medium">Upload URL (one-time):</div>
                    <div className="break-all">{url}</div>
                    <div className="mt-1">
                        After uploading, your HLS playback URL is:{" "}
                        <code>https://videodelivery.net/{uid}/manifest/video.m3u8</code>
                    </div>
                </div>
            )}
        </div>
    );
}