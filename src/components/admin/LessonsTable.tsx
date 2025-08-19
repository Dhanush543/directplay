// src/components/admin/LessonsTable.tsx
"use client";

import * as React from "react";

type Lesson = {
    id: string;
    index: number;
    title: string;
    videoUrl?: string | null;
};

type Props = {
    courseId: string;
    lessons: Lesson[];
    /** Called after a successful create/update/delete/reorder to let parent refetch */
    onChanged?: () => void;
};

export default function LessonsTable({ courseId, lessons: initialLessons, onChanged }: Props): React.JSX.Element {
    const [rows, setRows] = React.useState<Lesson[]>([...initialLessons].sort((a: Lesson, b: Lesson) => a.index - b.index));
    const [creating, setCreating] = React.useState<boolean>(false);
    const [newTitle, setNewTitle] = React.useState<string>("");
    const [newVideo, setNewVideo] = React.useState<string>("");
    const [savingId, setSavingId] = React.useState<string | null>(null);
    const [orderDirty, setOrderDirty] = React.useState<boolean>(false);

    React.useEffect(() => {
        // If parent updates lessons (e.g., after server refresh), sync local state
        setRows([...initialLessons].sort((a: Lesson, b: Lesson) => a.index - b.index));
        setOrderDirty(false);
    }, [initialLessons]);

    function renumber(next: Lesson[]): Lesson[] {
        // Ensure contiguous 1..n indices
        return next
            .map((l: Lesson, i: number) => ({ ...l, index: i + 1 }))
            .sort((a: Lesson, b: Lesson) => a.index - b.index);
    }

    function move(id: string, dir: "up" | "down"): void {
        setRows((prev: Lesson[]) => {
            const list = [...prev].sort((a: Lesson, b: Lesson) => a.index - b.index);
            const idx = list.findIndex((l: Lesson) => l.id === id);
            if (idx < 0) return prev;
            const swapWith = dir === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= list.length) return prev;
            const tmp = list[idx];
            list[idx] = list[swapWith];
            list[swapWith] = tmp;
            const renum = renumber(list);
            setOrderDirty(true);
            return renum;
        });
    }

    async function saveOrder(): Promise<void> {
        try {
            const orderedIds = rows.map((l: Lesson) => l.id);
            // Preferred bulk reorder endpoint (to be implemented server-side)
            const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons/reorder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderedIds }),
            });
            if (!res.ok) {
                // Fallback: PUT each index one-by-one
                for (const [i, l] of rows.entries()) {
                    // eslint-disable-next-line no-await-in-loop
                    const r = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(l.id)}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ index: i + 1 }),
                    });
                    if (!r.ok) throw new Error("Failed to update order");
                }
            }
            setOrderDirty(false);
            onChanged?.();
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to save order");
        }
    }

    async function saveRow(l: Lesson): Promise<void> {
        setSavingId(l.id);
        try {
            const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(l.id)}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: l.title, videoUrl: l.videoUrl ?? null, index: l.index }),
            });
            if (!res.ok) throw new Error("Save failed");
            onChanged?.();
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to save lesson");
        } finally {
            setSavingId(null);
        }
    }

    async function removeRow(id: string): Promise<void> {
        if (!confirm("Delete this lesson? This cannot be undone.")) return;
        setSavingId(id);
        try {
            const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Delete failed");
            setRows((prev: Lesson[]) => renumber(prev.filter((l: Lesson) => l.id !== id)));
            setOrderDirty(true);
            onChanged?.();
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to delete lesson");
        } finally {
            setSavingId(null);
        }
    }

    async function createRow(): Promise<void> {
        const title = newTitle.trim();
        if (!title) return;
        setCreating(true);
        try {
            const index = rows.length + 1;
            const res = await fetch(`/api/admin/courses/${encodeURIComponent(courseId)}/lessons`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, index, videoUrl: newVideo.trim() || null }),
            });
            if (!res.ok) throw new Error("Create failed");
            setNewTitle("");
            setNewVideo("");
            onChanged?.();
        } catch (err: unknown) {
            console.error(err);
            alert("Failed to create lesson");
        } finally {
            setCreating(false);
        }
    }

    return (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div className="font-semibold">Lessons</div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className={`rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-slate-300 ${orderDirty ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                        onClick={saveOrder}
                        disabled={!orderDirty}
                        title={orderDirty ? "Save new order" : "Order is up to date"}
                    >
                        Save order
                    </button>
                </div>
            </div>

            <div className="divide-y divide-slate-200">
                {/* header row */}
                <div className="grid grid-cols-12 gap-3 px-4 py-2 text-xs uppercase tracking-wide text-slate-500 bg-slate-50">
                    <div className="col-span-1">#</div>
                    <div className="col-span-4">Title</div>
                    <div className="col-span-5">Video URL</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* body rows */}
                {rows.map((l: Lesson, i: number) => (
                    <div key={l.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-start">
                        <div className="col-span-1 pt-2 text-sm text-slate-500">{l.index}</div>

                        <div className="col-span-4">
                            <input
                                type="text"
                                value={l.title}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = e.target.value;
                                    setRows((prev: Lesson[]) => prev.map((t: Lesson) => (t.id === l.id ? { ...t, title: v } : t)));
                                }}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                placeholder="Lesson title"
                            />
                        </div>

                        <div className="col-span-5">
                            <input
                                type="text"
                                value={l.videoUrl ?? ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    const v = e.target.value;
                                    setRows((prev: Lesson[]) => prev.map((t: Lesson) => (t.id === l.id ? { ...t, videoUrl: v } : t)));
                                }}
                                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                                placeholder="https://videodelivery.net/... or https://..."
                            />
                        </div>

                        <div className="col-span-2 flex justify-end gap-2">
                            <button
                                type="button"
                                className="rounded-md px-2.5 py-1.5 text-sm ring-1 ring-slate-300 bg-white hover:bg-slate-50"
                                onClick={() => move(l.id, "up")}
                                disabled={i === 0}
                                title="Move up"
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                className="rounded-md px-2.5 py-1.5 text-sm ring-1 ring-slate-300 bg-white hover:bg-slate-50"
                                onClick={() => move(l.id, "down")}
                                disabled={i === rows.length - 1}
                                title="Move down"
                            >
                                ↓
                            </button>
                            <button
                                type="button"
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800"
                                onClick={() => saveRow(l)}
                                disabled={savingId === l.id}
                            >
                                {savingId === l.id ? "Saving…" : "Save"}
                            </button>
                            <button
                                type="button"
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-red-600 ring-1 ring-red-200 bg-white hover:bg-red-50"
                                onClick={() => removeRow(l.id)}
                                disabled={savingId === l.id}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}

                {/* create row */}
                <div className="grid grid-cols-12 gap-3 px-4 py-3 items-start bg-slate-50/60">
                    <div className="col-span-1 pt-2 text-sm text-slate-500">{rows.length + 1}</div>
                    <div className="col-span-4">
                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTitle(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            placeholder="New lesson title"
                        />
                    </div>
                    <div className="col-span-5">
                        <input
                            type="text"
                            value={newVideo}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewVideo(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                            placeholder="Optional video URL"
                        />
                    </div>
                    <div className="col-span-2 flex justify-end">
                        <button
                            type="button"
                            onClick={createRow}
                            disabled={creating || !newTitle.trim()}
                            className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {creating ? "Adding…" : "Add lesson"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
