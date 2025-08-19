//src/components/NotesEditor.tsx
"use client";

import { useState, useTransition } from "react";

type Props = {
    initial: string;
    onSave: (formData: FormData) => Promise<void>;
    lessonId: string;
};

export default function NotesEditor({ initial, onSave, lessonId }: Props) {
    const [value, setValue] = useState<string>(initial);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = () => {
        const fd = new FormData();
        fd.set("lessonId", lessonId);
        fd.set("content", value);
        startTransition(async () => {
            await onSave(fd);
        });
    };

    return (
        <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Your notes</h3>
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-md bg-slate-900 text-white text-sm px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
                    disabled={isPending}
                >
                    {isPending ? "Saving…" : "Save notes"}
                </button>
            </div>
            <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="mt-3 w-full min-h-[140px] rounded-md border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                placeholder="Write thoughts, code snippets, or links for this lesson…"
            />
            <p className="mt-2 text-xs text-slate-500">
                Notes are saved per lesson and synced to your account.
            </p>
        </div>
    );
}