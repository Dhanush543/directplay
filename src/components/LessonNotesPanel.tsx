// src/components/LessonNotesPanel.tsx
"use client";

import * as React from "react";

type Props = {
    courseId: string;
    lessonId: string;
    initial?: string;
};

export default function LessonNotesPanel({ courseId, lessonId, initial = "" }: Props) {
    const [value, setValue] = React.useState<string>(initial);
    const [saving, setSaving] = React.useState<boolean>(false);
    const [savedAt, setSavedAt] = React.useState<number>(0);
    const [error, setError] = React.useState<string | null>(null);

    async function saveNote() {
        if (!lessonId || !courseId) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/lesson-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ courseId, lessonId, content: value }),
            });
            if (!res.ok) throw new Error((await res.text()) || "Failed to save");
            setSavedAt(Date.now());
        } catch (e: any) {
            setError(e?.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    }

    // Debounced auto-save after user stops typing
    React.useEffect(() => {
        const id = window.setTimeout(() => {
            if (value !== initial) void saveNote();
        }, 800);
        return () => window.clearTimeout(id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, lessonId, courseId]);

    return (
        <div className="rounded-xl border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
                <div className="text-sm font-medium">Your notes for this lesson</div>
                <div className="text-xs text-slate-500">
                    {saving ? "Saving…" : savedAt ? `Saved ${new Date(savedAt).toLocaleTimeString()}` : "Auto-saves"}
                </div>
            </div>
            <textarea
                className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                rows={5}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Write quick notes, links, code, or questions…"
            />
            <div className="mt-2 flex items-center justify-between">
                {error ? (
                    <div className="text-xs text-rose-600">{error}</div>
                ) : (
                    <span className="text-xs text-slate-500">Tip: notes auto-save after you stop typing.</span>
                )}
                <button
                    type="button"
                    onClick={saveNote}
                    disabled={saving}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                >
                    {saving ? "Saving…" : "Save now"}
                </button>
            </div>
        </div>
    );
}