// src/app/admin/courses/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import {
    updateCourseAction,
    createLessonAction,
    updateLessonAction,
    deleteLessonAction,
    moveLessonAction,
} from "./actions";
import { requireAdminOrNotFound } from "@/lib/auth";
import { cookies } from "next/headers";
import Script from "next/script";
import StreamCostEstimator from "@/components/admin/StreamCostEstimator";

export const dynamic = "force-dynamic";

/* ---------------- data ---------------- */

async function getCourseByIdOrSlug(idOrSlug: string) {
    return prisma.course.findFirst({
        where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            durationHours: true,
            priceINR: true,
            points: true,
            ogImage: true,
            previewPoster: true,
            published: true,
            comingSoon: true,
            createdAt: true,
            updatedAt: true,
            _count: { select: { enrollments: true, lessons: true } },
            lessons: {
                orderBy: { index: "asc" },
                select: { id: true, index: true, title: true, videoUrl: true },
            },
        },
    });
}

type FlashPayload = { type: "success" | "error" | "info"; message: string };

async function readFlash(): Promise<FlashPayload | null> {
    try {
        const jar = await cookies(); // <-- await
        const raw = jar.get("flash")?.value;
        if (!raw) return null;

        // Clear it so it shows only once
        try {
            await jar.set("flash", "", { expires: new Date(0), path: "/" });
        } catch {
            /* ignore */
        }

        try {
            return JSON.parse(raw) as FlashPayload;
        } catch {
            return { type: "info", message: String(raw) };
        }
    } catch {
        return null;
    }
}

export default async function AdminCourseEditorPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    await requireAdminOrNotFound();
    const flash = await readFlash();

    const { id } = await params;
    const course = await getCourseByIdOrSlug(id);
    if (!course) notFound();

    const pointsText = Array.isArray(course.points)
        ? (course.points as string[]).join("\n")
        : "";

    return (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Edit course</h1>
                <Link
                    href="/admin/courses"
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                    ← Back to courses
                </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Course meta */}
                <section className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                    <h2 className="font-semibold">Course details</h2>
                    <form action={updateCourseAction} className="mt-4 space-y-4">
                        {/* supply identity for the action */}
                        <input type="hidden" name="id" value={course.id} />
                        <input type="hidden" name="currentSlug" value={course.slug} />

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Title</label>
                                <input
                                    name="title"
                                    defaultValue={course.title}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Slug</label>
                                <input
                                    name="slug"
                                    defaultValue={course.slug}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                    required
                                />
                                <p className="mt-1 text-xs text-slate-500">
                                    Changing this will also change the public URL.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Description</label>
                            <textarea
                                name="description"
                                defaultValue={course.description ?? ""}
                                rows={4}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                            />
                        </div>

                        <div className="grid sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Level</label>
                                <input
                                    name="level"
                                    placeholder="Beginner / Intermediate / Advanced"
                                    defaultValue={course.level ?? ""}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Duration (hrs)</label>
                                <input
                                    type="number"
                                    min={0}
                                    name="durationHours"
                                    defaultValue={course.durationHours ?? ""}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Price (INR)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    name="priceINR"
                                    defaultValue={course.priceINR ?? ""}
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Preview poster URL</label>
                                <input
                                    name="previewPoster"
                                    defaultValue={course.previewPoster ?? ""}
                                    placeholder="/images/abc.png or https://…"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">OG image URL</label>
                                <input
                                    name="ogImage"
                                    defaultValue={course.ogImage ?? ""}
                                    placeholder="/og.png or https://…"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium">Key points</label>
                            <textarea
                                name="points"
                                defaultValue={pointsText}
                                rows={4}
                                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                                placeholder={`Each line becomes a bullet\ne.g.\nProject-based lessons\nInterview-focused practice`}
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                You can also paste a JSON array (e.g. <code>["A","B"]</code>).
                            </p>
                        </div>

                        <div className="flex items-center gap-6">
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="published"
                                    defaultChecked={course.published}
                                    className="h-4 w-4"
                                />
                                <span>Published</span>
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="comingSoon"
                                    defaultChecked={course.comingSoon}
                                    className="h-4 w-4"
                                />
                                <span>Coming soon</span>
                            </label>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-lg bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800"
                            >
                                Save course
                            </button>
                            <span className="ml-3 text-xs text-slate-500">
                                Created {new Date(course.createdAt).toLocaleString()} • Last
                                updated {new Date(course.updatedAt).toLocaleString()}
                            </span>
                        </div>
                    </form>
                </section>

                {/* At-a-glance */}
                <aside className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                    <h2 className="font-semibold">Summary</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <dt className="text-slate-600">Slug</dt>
                            <dd className="font-medium">{course.slug}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-600">Lessons</dt>
                            <dd className="font-medium">{course._count.lessons}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-600">Enrollments</dt>
                            <dd className="font-medium">{course._count.enrollments}</dd>
                        </div>
                        <div className="flex justify-between">
                            <dt className="text-slate-600">State</dt>
                            <dd className="font-medium">
                                {course.published ? "Published" : "Draft"}
                                {course.comingSoon ? " • Coming soon" : ""}
                            </dd>
                        </div>
                    </dl>
                    <div className="mt-4 space-y-2">
                        <Link
                            className="block text-indigo-600 hover:text-indigo-700 text-sm"
                            href={`/courses/${course.slug}`}
                        >
                            View public course →
                        </Link>
                        <Link
                            className="block text-indigo-600 hover:text-indigo-700 text-sm"
                            href={`/learn/${course.slug}`}
                        >
                            Open in learner view →
                        </Link>
                    </div>
                </aside>
            </div>

            {/* Lessons */}
            <section className="mt-8 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Lessons</h2>
                    <span className="text-sm text-slate-500">Total: {course.lessons.length}</span>
                </div>
                {flash ? (
                    <>
                        <div
                            id="flash-banner"
                            className={`mt-3 mb-3 rounded-lg border px-3 py-2 text-sm ${flash.type === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : flash.type === "error"
                                    ? "border-red-200 bg-red-50 text-red-800"
                                    : "border-slate-200 bg-slate-50 text-slate-700"
                                }`}
                            role="status"
                            aria-live="polite"
                        >
                            {flash.message}
                        </div>
                        <Script id="flash-autohide" strategy="afterInteractive">
                            {`
      (function () {
        var el = document.getElementById('flash-banner');
        if (!el) return;

        // Auto-hide after 3.2s
        setTimeout(function () {
          if (!el) return;
          el.style.transition = 'opacity 300ms ease';
          el.style.opacity = '0';
          setTimeout(function(){ if (el) el.style.display = 'none'; }, 320);
        }, 3200);

        // Allow manual dismiss on click
        el.addEventListener('click', function () {
          el.style.transition = 'opacity 150ms ease';
          el.style.opacity = '0';
          setTimeout(function(){ el.style.display = 'none'; }, 180);
        }, { once: true });
      })();
    `}
                        </Script>
                    </>
                ) : null}
                <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-slate-600 border-b">
                                <th className="py-2 pr-4">#</th>
                                <th className="py-2 pr-4">Title</th>
                                <th className="py-2 pr-4">Video URL</th>
                                <th className="py-2 pr-4">Reorder</th>
                                <th className="py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {course.lessons.map((l: { id: string; index: number; title: string; videoUrl: string | null }) => (
                                <tr key={l.id} className="border-b last:border-0 align-top">
                                    {/* Single UPDATE form for index+title+videoUrl */}
                                    <td className="py-2 pr-4 w-16">
                                        <form id={`f-${l.id}`} action={updateLessonAction}>
                                            <input type="hidden" name="id" value={l.id} />
                                            <input
                                                type="number"
                                                name="index"
                                                min={1}
                                                defaultValue={l.index}
                                                className="w-16 rounded-md border border-slate-300 px-2 py-1"
                                            />
                                        </form>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <input
                                            form={`f-${l.id}`}
                                            name="title"
                                            defaultValue={l.title}
                                            className="w-full rounded-md border border-slate-300 px-2 py-1"
                                        />
                                        <p className="text-xs text-slate-500">
                                            ID: <code>{l.id}</code>
                                        </p>
                                    </td>
                                    <td className="py-2 pr-4">
                                        <input
                                            form={`f-${l.id}`}
                                            name="videoUrl"
                                            defaultValue={l.videoUrl ?? ""}
                                            placeholder="Cloudflare Stream / HLS URL"
                                            className="w-full rounded-md border border-slate-300 px-2 py-1"
                                        />
                                        <div className="text-xs text-slate-500 mt-1">
                                            <em>Tip:</em> Use{" "}
                                            <span className="font-medium">Get upload URL</span> to upload a file to Cloudflare Stream,
                                            then paste the HLS URL here.
                                        </div>
                                    </td>

                                    {/* Move has its own form so it only sends id + targetIndex */}
                                    <td className="py-2 pr-4 whitespace-nowrap">
                                        <form action={moveLessonAction} className="inline-flex items-center gap-2">
                                            <input type="hidden" name="id" value={l.id} />
                                            <input
                                                type="number"
                                                name="targetIndex"
                                                min={1}
                                                defaultValue={l.index}
                                                className="w-20 rounded-md border border-slate-300 px-2 py-1"
                                            />
                                            <button
                                                type="submit"
                                                className="rounded-md border px-2 py-1 hover:bg-slate-50"
                                                title="Move to index"
                                            >
                                                Move
                                            </button>
                                        </form>
                                    </td>

                                    <td className="py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="submit"
                                                form={`f-${l.id}`}
                                                className="rounded-md bg-slate-900 text-white px-3 py-1.5 text-xs hover:bg-slate-800"
                                                title="Save changes"
                                            >
                                                Update
                                            </button>

                                            <form action={deleteLessonAction}>
                                                <input type="hidden" name="id" value={l.id} />
                                                <button
                                                    type="submit"
                                                    className="rounded-md border border-red-200 text-red-700 px-3 py-1.5 text-xs hover:bg-red-50"
                                                    title="Delete lesson"
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {course.lessons.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-6 text-center text-slate-500">
                                        No lessons yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add new lesson */}
                <div className="mt-6 rounded-lg border border-slate-200 p-3">
                    <h3 className="font-medium">Add lesson</h3>
                    <form action={createLessonAction} className="mt-3 grid sm:grid-cols-3 gap-3">
                        <input type="hidden" name="courseId" value={course.id} />
                        <div>
                            <label className="block text-sm font-medium">Index</label>
                            <input
                                type="number"
                                name="index"
                                min={1}
                                defaultValue={course.lessons.length + 1}
                                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
                                required
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-sm font-medium">Title</label>
                            <input
                                name="title"
                                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
                                required
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium">Video URL</label>
                            <input
                                name="videoUrl"
                                placeholder="Cloudflare Stream / HLS URL"
                                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <button
                                type="submit"
                                className="inline-flex items-center rounded-lg bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800"
                            >
                                Add lesson
                            </button>
                        </div>
                    </form>
                </div>
            </section>

            {/* Stream cost estimator */}
            <section className="mt-8 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                <h2 className="font-semibold">Estimate Video Cost</h2>
                <p className="mt-1 text-sm text-slate-600">
                    Quick calculator for Cloudflare Stream cost and breakeven price.
                </p>
                <div className="mt-3">
                    <StreamCostEstimator />
                </div>
            </section>

            {/* Lazy area */}
            <section className="mt-8">
                <Suspense fallback={<div className="h-24 rounded-xl bg-slate-50 animate-pulse" />}>
                    <AdminCourseExtras courseId={course.id} />
                </Suspense>
            </section>
        </main>
    );
}

/* -------------- Extras: light stats placeholder (separate query) -------------- */
async function AdminCourseExtras({ courseId }: { courseId: string }) {
    const totals = await prisma.lessonProgress.groupBy({
        by: ["completed"] as const,
        where: { courseId },
        _count: { _all: true },
    });

    const done =
        totals.find((t: { completed: boolean; _count: { _all: number } }) => t.completed)?._count
            ._all ?? 0;
    const all = totals.reduce(
        (a: number, t: { _count: { _all: number } }) => a + t._count._all,
        0
    );

    return (
        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
            <h3 className="font-semibold">Engagement</h3>
            <div className="mt-2 text-sm text-slate-600">
                Lesson progress rows: <span className="font-medium">{all}</span> • Completed:{" "}
                <span className="font-medium">{done}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
                (You can expand this section later with charts and per-lesson breakdowns.)
            </p>
        </div>
    );
}