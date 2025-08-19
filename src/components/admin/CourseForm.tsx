// src/components/admin/CourseForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, ArrowLeft, Trash2 } from "lucide-react";

// Keep dependencies minimal (plain inputs) to avoid coupling to UI libs.
// Tailwind classes are used for styling to match the rest of the app.

export type CourseFormData = {
    id?: string;
    title: string;
    slug: string;
    description?: string | null;
    level?: string | null; // "Beginner" | "Intermediate" | "Advanced"
    durationHours?: number | null;
    priceINR?: number | null;
    points?: string[] | null; // bullet points
    ogImage?: string | null;
    previewPoster?: string | null;
    published: boolean;
    comingSoon: boolean;
};

type Props = {
    initial?: CourseFormData; // undefined → create mode
    backHref?: string; // defaults to /admin/courses
    // If provided, called after a successful save (server response JSON passed in)
    onSaved?: (payload: unknown) => void;
};

function slugify(input: string): string {
    return input
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

export default function CourseForm({
    initial,
    backHref = "/admin/courses",
    onSaved,
}: Props) {
    const router = useRouter();

    const [title, setTitle] = React.useState<string>(initial?.title ?? "");
    const [slug, setSlug] = React.useState<string>(initial?.slug ?? "");
    const [description, setDescription] = React.useState<string>(
        initial?.description ?? ""
    );
    const [level, setLevel] = React.useState<string>(initial?.level ?? "");
    const [durationHours, setDurationHours] = React.useState<string>(
        initial?.durationHours != null ? String(initial.durationHours) : ""
    );
    const [priceINR, setPriceINR] = React.useState<string>(
        initial?.priceINR != null ? String(initial.priceINR) : ""
    );
    const [points, setPoints] = React.useState<string>(
        (initial?.points ?? []).join("\n")
    );
    const [ogImage, setOgImage] = React.useState<string>(initial?.ogImage ?? "");
    const [previewPoster, setPreviewPoster] = React.useState<string>(
        initial?.previewPoster ?? ""
    );
    const [published, setPublished] = React.useState<boolean>(
        initial?.published ?? true
    );
    const [comingSoon, setComingSoon] = React.useState<boolean>(
        initial?.comingSoon ?? false
    );

    const [saving, setSaving] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    // Auto-suggest slug as the title changes (but don’t overwrite once user edits slug manually)
    const slugEditedRef = React.useRef<boolean>(Boolean(initial?.slug));
    React.useEffect(() => {
        if (!slugEditedRef.current) setSlug(slugify(title));
    }, [title]);

    function handleSlugManualChange(e: React.ChangeEvent<HTMLInputElement>) {
        slugEditedRef.current = true;
        setSlug(e.target.value);
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            if (!title.trim()) throw new Error("Title is required");
            if (!slug.trim()) throw new Error("Slug is required");

            const body: CourseFormData = {
                id: initial?.id,
                title: title.trim(),
                slug: slugify(slug),
                description: description.trim() || null,
                level: level || null,
                durationHours: durationHours ? Number(durationHours) : null,
                priceINR: priceINR ? Number(priceINR) : null,
                points: points
                    .split("\n")
                    .map((line: string) => line.trim())
                    .filter((line: string) => line.length > 0),
                ogImage: ogImage.trim() || null,
                previewPoster: previewPoster.trim() || null,
                published,
                comingSoon,
            };

            const isEdit = Boolean(initial?.id);
            const url = isEdit
                ? `/api/admin/courses/${encodeURIComponent(String(initial?.id))}`
                : "/api/admin/courses";
            const method = isEdit ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to save course");
            }

            const json = (await res.json()) as unknown;
            if (onSaved) onSaved(json);

            // Go back to list (or to the course editor detail)
            router.push(backHref);
            router.refresh();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Something went wrong";
            setError(msg);
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div>
                    <div className="text-xs font-semibold tracking-widest text-violet-600">
                        {initial?.id ? "EDIT COURSE" : "NEW COURSE"}
                    </div>
                    <h1 className="mt-1 text-2xl font-bold">
                        {title || "Create a course"}
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back
                    </Link>
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Saving
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" /> Save
                            </>
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Left: Main */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium">Title</label>
                                <input
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setTitle(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="JavaScript Foundations"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Slug</label>
                                <input
                                    value={slug}
                                    onChange={handleSlugManualChange}
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="javascript-foundations"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    /courses/{slug || "your-slug"}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Level</label>
                                <select
                                    value={level}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                        setLevel(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                >
                                    <option value="">—</option>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">
                                    Duration (hours)
                                </label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={durationHours}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setDurationHours(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="12"
                                    min={0}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Price (INR)</label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={priceINR}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setPriceINR(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    placeholder="4999"
                                    min={0}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setDescription(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    rows={4}
                                    placeholder="Long description for the marketing page"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm font-medium">
                                    Points (one per line)
                                </label>
                                <textarea
                                    value={points}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                        setPoints(e.target.value)
                                    }
                                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                    rows={4}
                                    placeholder={"Hands-on projects\nDownloadable notes\nInterview prep"}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Meta */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div>
                            <label className="block text-sm font-medium">
                                Preview poster URL
                            </label>
                            <input
                                value={previewPoster}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPreviewPoster(e.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                placeholder="/images/courses/js-foundations.jpg or https://…"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-sm font-medium">OG image URL</label>
                            <input
                                value={ogImage}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setOgImage(e.target.value)
                                }
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                                placeholder="/og.png or https://…"
                            />
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <label className="text-sm">Published</label>
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setPublished(e.target.checked)
                                }
                            />
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                            <label className="text-sm">Coming soon</label>
                            <input
                                type="checkbox"
                                checked={comingSoon}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setComingSoon(e.target.checked)
                                }
                            />
                        </div>
                    </div>

                    {initial?.id && (
                        <DangerZone courseId={String(initial.id)} backHref={backHref} />
                    )}
                </div>
            </div>
        </form>
    );
}

function DangerZone({
    courseId,
    backHref,
}: {
    courseId: string;
    backHref: string;
}) {
    const router = useRouter();
    const [confirm, setConfirm] = React.useState<string>("");
    const [busy, setBusy] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onDelete() {
        try {
            setBusy(true);
            setError(null);
            const res = await fetch(
                `/api/admin/courses/${encodeURIComponent(courseId)}`,
                {
                    method: "DELETE",
                }
            );
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to delete course");
            }
            router.push(backHref);
            router.refresh();
        } catch (err) {
            const msg =
                err instanceof Error ? err.message : "Something went wrong";
            setError(msg);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold text-red-800">Danger zone</div>
            <p className="mt-1 text-sm text-red-700">
                Deleting a course removes its lessons and related user progress. This
                cannot be undone.
            </p>

            <div className="mt-3">
                <label className="block text-xs font-medium text-red-800">
                    Type <span className="font-mono">DELETE</span> to confirm
                </label>
                <input
                    value={confirm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setConfirm(e.target.value)
                    }
                    className="mt-1 w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    placeholder="DELETE"
                />
            </div>

            {error && (
                <div className="mt-2 rounded-lg border border-red-200 bg-white/60 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            <div className="mt-3">
                <button
                    type="button"
                    disabled={confirm !== "DELETE" || busy}
                    onClick={onDelete}
                    className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                    {busy ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Deleting…
                        </>
                    ) : (
                        <>
                            <Trash2 className="h-4 w-4" /> Delete course
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}