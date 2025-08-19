//src/components/learn/LearnCourseClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import LessonNotesPanel from "@/components/LessonNotesPanel";
import { toast } from "sonner";

type Lesson = {
    id: string;
    index: number;
    title: string;
    completed: boolean;
    videoUrl?: string;
};

type Props = {
    courseId: string;
    courseSlug: string;
    title: string;
    lessons: Lesson[];
    initialIndex: number;
    initialNote: string;
};

export default function LearnCourseClient({
    courseId,
    courseSlug,
    title,
    lessons: initialLessons,
    initialIndex,
    initialNote,
}: Props) {
    const [lessons, setLessons] = React.useState<Lesson[]>(initialLessons);
    const [currentIdx, setCurrentIdx] = React.useState<number>(
        Math.max(0, Math.min(initialLessons.length - 1, initialIndex))
    );
    const current = lessons[currentIdx];

    const [noteBootstrap, setNoteBootstrap] = React.useState<string>(initialNote);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const saveTimer = React.useRef<number | null>(null);
    const [position, setPosition] = React.useState<number>(0);
    const [saving, setSaving] = React.useState<boolean>(false);

    // derive live progress directly from lessons
    const done = lessons.filter((l) => l.completed).length;
    const total = lessons.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    // show a sticky "course complete" banner when pct === 100
    const [completeDismissed, setCompleteDismissed] = React.useState(false);
    const showComplete = pct === 100 && !completeDismissed;

    // max unlocked index (sequential gating)
    const lastCompletedIdx = Math.max(-1, ...lessons.map((l, i) => (l.completed ? i : -1)));
    const maxUnlockedIndex = Math.min(
        lastCompletedIdx >= 0 ? lastCompletedIdx + 1 : 0,
        Math.max(0, lessons.length - 1)
    );

    function bumpProgressIfNeeded(idx: number) {
        setLessons((ls) => ls.map((l, i) => (i === idx ? { ...l, completed: true } : l)));
    }

    // Prefetch notes + resume position
    React.useEffect(() => {
        let cancelled = false;

        async function load() {
            setNoteBootstrap("");
            setPosition(0);

            // notes
            try {
                const res = await fetch(
                    `/api/lesson-notes?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(
                        current.id
                    )}`
                );
                if (!cancelled && res.ok) {
                    const data = (await res.json()) as { content?: string };
                    setNoteBootstrap(data?.content ?? "");
                }
            } catch { }

            // progress
            try {
                const url = new URL("/api/lesson-progress", window.location.origin);
                url.searchParams.set("courseId", courseId);
                url.searchParams.set("lessonId", current.id);
                const res = await fetch(url.toString());
                if (!cancelled && res.ok) {
                    const data = (await res.json()) as { positionSeconds?: number };
                    const pos = Math.max(0, Math.floor(Number(data?.positionSeconds ?? 0)));
                    setPosition(pos);
                    queueMicrotask(() => {
                        const el = videoRef.current;
                        if (el) {
                            try {
                                if (pos > 0) el.currentTime = pos;
                                void el.play().catch(() => { });
                            } catch { }
                        }
                    });
                }
            } catch { }
        }

        void load();
        return () => {
            cancelled = true;
            if (saveTimer.current) {
                window.clearTimeout(saveTimer.current);
                saveTimer.current = null;
            }
        };
    }, [current.id, courseId]);

    // Debounced save (position / complete) with server-guard handling
    const scheduleSave = React.useCallback(
        (nextPos: number, markComplete = false) => {
            if (saveTimer.current) window.clearTimeout(saveTimer.current);
            saveTimer.current = window.setTimeout(async () => {
                setSaving(true);
                try {
                    const res = await fetch("/api/lesson-progress", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            courseId,
                            lessonId: current.id,
                            positionSeconds: nextPos,
                            completed: markComplete,
                        }),
                    });

                    if (!res.ok) {
                        // Handle sequential blocking
                        if (res.status === 409) {
                            const data = (await res.json().catch(() => ({}))) as { message?: string };
                            toast.error(data?.message || "Please complete earlier lessons first.");
                            return;
                        }
                        const txt = await res.text().catch(() => "");
                        toast.error(txt || "Failed to save progress");
                        return;
                    }

                    if (markComplete) bumpProgressIfNeeded(currentIdx);
                } catch {
                    toast.error("Network error while saving progress");
                } finally {
                    setSaving(false);
                }
            }, markComplete ? 0 : 1200);
        },
        [courseId, current.id, currentIdx]
    );

    // Video events
    const onTimeUpdate = () => {
        const el = videoRef.current;
        if (!el) return;
        const t = Math.floor(el.currentTime || 0);
        setPosition(t);
        scheduleSave(t);
    };

    const onPause = () => {
        const el = videoRef.current;
        if (!el) return;
        scheduleSave(Math.floor(el.currentTime || 0));
    };

    const onEnded = () => {
        const t = Math.floor(videoRef.current?.currentTime || 0);
        scheduleSave(t, true);
        toast.success(`Lesson complete: ${current.title}`, {
            description:
                currentIdx < lessons.length - 1
                    ? `Next up: ${lessons[currentIdx + 1].title}`
                    : "That was the last lesson 🎉",
        });
        setTimeout(() => setCurrentIdx((i) => Math.min(i + 1, lessons.length - 1)), 2000);
    };

    // Manual mark complete (button in placeholder UI)
    const markCompleteNow = async () => {
        if (current.completed) return;
        setSaving(true);
        try {
            const res = await fetch("/api/lesson-progress", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseId,
                    lessonId: current.id,
                    positionSeconds: position,
                    completed: true,
                }),
            });

            if (!res.ok) {
                if (res.status === 409) {
                    const data = (await res.json().catch(() => ({}))) as { message?: string };
                    toast.error(data?.message || "Please complete earlier lessons first.");
                    return;
                }
                const txt = await res.text().catch(() => "");
                toast.error(txt || "Failed to mark complete");
                return;
            }

            bumpProgressIfNeeded(currentIdx);
            toast.success(`Lesson complete: ${current.title}`, {
                description:
                    currentIdx < lessons.length - 1
                        ? `Next up: ${lessons[currentIdx + 1].title}`
                        : "That was the last lesson 🎉",
            });
            setTimeout(() => setCurrentIdx((i) => Math.min(i + 1, lessons.length - 1)), 2000);
        } finally {
            setSaving(false);
        }
    };

    // Keyboard shortcuts (with sequential gating on ↓)
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            const el = videoRef.current;
            if (!el) return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
                return;

            switch (e.key) {
                case "j":
                case "J":
                    el.currentTime = Math.max(0, el.currentTime - 10);
                    break;
                case "k":
                case "K":
                    if (el.paused) void el.play();
                    else el.pause();
                    break;
                case "l":
                case "L":
                    el.currentTime = Math.min(el.duration || Number.MAX_SAFE_INTEGER, el.currentTime + 10);
                    break;
                case "ArrowUp":
                    setCurrentIdx((i) => Math.max(0, i - 1));
                    break;
                case "ArrowDown":
                    setCurrentIdx((i) => {
                        const next = Math.min(lessons.length - 1, i + 1);
                        if (next > maxUnlockedIndex) {
                            toast.error("Complete previous lessons to unlock");
                            return i;
                        }
                        return next;
                    });
                    break;
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lessons.length, maxUnlockedIndex]);

    return (
        <>
            {/* Sticky, floating "course complete" banner */}
            {showComplete && (
                <div className="fixed top-16 left-0 right-0 z-30">
                    <div className="mx-auto max-w-3xl px-4">
                        <div className="rounded-xl bg-emerald-600 text-white shadow-lg ring-1 ring-emerald-500/30">
                            <div className="flex items-center justify-between gap-3 px-4 py-3">
                                <div className="text-sm">
                                    <div className="font-semibold">Course complete 🎉</div>
                                    <div className="text-emerald-100">
                                        You finished <span className="font-medium">{title}</span>. Great job!
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center rounded-md bg-white/15 px-3 py-1.5 text-sm font-medium hover:bg-white/25 transition"
                                    >
                                        Back to dashboard
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => setCompleteDismissed(true)}
                                        aria-label="Dismiss course complete"
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/15 hover:bg-white/25 transition"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT */}
                <section className="lg:col-span-8">
                    <PlayerCard
                        courseSlug={courseSlug}
                        current={current}
                        videoRef={videoRef}
                        resumePosition={position}
                        onTimeUpdate={onTimeUpdate}
                        onPause={onPause}
                        onEnded={onEnded}
                        fallbackMarkComplete={markCompleteNow}
                        saving={saving}
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                        <div>
                            {done}/{total} lessons • {pct}% complete
                            {saving ? " • saving…" : ""}
                        </div>
                        <div>
                            Now playing: <span className="font-medium">{current.title}</span>
                        </div>
                    </div>
                    <div className="mt-6">
                        <LessonNotesPanel courseId={courseId} lessonId={current.id} initial={noteBootstrap} />
                    </div>
                </section>

                {/* RIGHT */}
                <aside className="lg:col-span-4">
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                        <div className="p-3 border-b border-slate-200 font-semibold">Up next</div>
                        <ul className="max-h-[70vh] overflow-auto">
                            {lessons.map((l, i) => {
                                const active = i === currentIdx;
                                const locked = i > maxUnlockedIndex;
                                return (
                                    <li key={l.id}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (locked) {
                                                    toast.error("Complete previous lessons to unlock");
                                                    return;
                                                }
                                                setCurrentIdx(i);
                                            }}
                                            disabled={locked}
                                            className={`w-full text-left px-3 py-3 flex items-start gap-3 ${active ? "bg-slate-50" : "hover:bg-slate-50"
                                                } ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            <span
                                                className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${l.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                                                    }`}
                                            >
                                                {l.index}
                                            </span>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium leading-tight">{l.title}</div>
                                                <div className="text-xs text-slate-500">
                                                    {l.completed ? "Completed" : locked ? "Locked" : "Not started"}
                                                </div>
                                            </div>
                                            {active && (
                                                <span className="text-[10px] text-indigo-600 font-semibold mt-0.5">Playing</span>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </aside>
            </div>
        </>
    );
}

function PlayerCard({
    courseSlug,
    current,
    videoRef,
    resumePosition,
    onTimeUpdate,
    onPause,
    onEnded,
    fallbackMarkComplete,
    saving,
}: {
    courseSlug: string;
    current: Lesson;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    resumePosition: number;
    onTimeUpdate: () => void;
    onPause: () => void;
    onEnded: () => void;
    fallbackMarkComplete: () => void;
    saving: boolean;
}) {
    const handleLoadedMetadata = React.useCallback(() => {
        const el = videoRef.current;
        if (!el) return;
        try {
            if (resumePosition > 0) el.currentTime = resumePosition;
            void el.play().catch(() => { });
        } catch { }
    }, [resumePosition, videoRef]);

    return (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
            <div className="aspect-video bg-slate-100 grid place-items-center">
                {current.videoUrl ? (
                    <video
                        ref={videoRef}
                        className="h-full w-full"
                        src={current.videoUrl}
                        controls
                        onTimeUpdate={onTimeUpdate}
                        onPause={onPause}
                        onEnded={onEnded}
                        onLoadedMetadata={handleLoadedMetadata}
                        playsInline
                    />
                ) : (
                    <div className="text-center">
                        <div className="text-sm uppercase tracking-wide text-slate-500">PREVIEW</div>
                        <div className="mt-1 text-lg font-semibold">{current.title}</div>
                        <div className="mt-2 text-xs text-slate-500">Video player placeholder</div>
                        {!current.completed ? (
                            <button
                                type="button"
                                onClick={fallbackMarkComplete}
                                className="mt-4 rounded-lg bg-slate-900 text-white px-3.5 py-2 text-sm"
                                disabled={saving}
                            >
                                {saving ? "Saving…" : "Mark complete"}
                            </button>
                        ) : (
                            <div className="mt-4 text-emerald-600 font-medium text-sm">Completed ✅</div>
                        )}
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-slate-200">
                <div className="text-sm font-medium">{current.title}</div>
                <div className="text-xs text-slate-500">Course: {courseSlug}</div>
            </div>
        </div>
    );
}