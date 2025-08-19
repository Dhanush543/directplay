// src/app/admin/media/page.tsx
import { requireAdminOrNotFound } from "@/lib/auth";
import prisma from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";

/**
 * Admin Media Library
 * - Simple library with search, kind filter, pagination
 * - Soft delete / restore
 * - Minimal “Add by URL” form (good until presigned uploads are wired)
 *
 * NOTE: The presigned upload flow (/api/admin/sign-upload & /api/admin/media)
 * will slot into this page later. For now, you can create a Media row with URL.
 */

export const dynamic = "force-dynamic";

/* ---------------------------- types ---------------------------- */

type SearchParams = {
    q?: string;
    kind?: string; // "image" | "video" | "other" | ""
    page?: string;
    includeDeleted?: string; // "1" | undefined
};

type MediaRow = {
    id: string;
    kind: string;
    key: string;
    url: string | null;
    width: number | null;
    height: number | null;
    sizeBytes: number | null;
    mime: string | null;
    courseId: string | null;
    lessonId: string | null;
    userId: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
};

/* ------------------------ server actions ------------------------ */

async function createMediaAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const kind = String(formData.get("kind") || "").trim() || "other";
    const key = String(formData.get("key") || "").trim();
    const url = String(formData.get("url") || "").trim() || null;
    const mime = String(formData.get("mime") || "").trim() || null;

    const widthRaw = formData.get("width");
    const heightRaw = formData.get("height");
    const sizeRaw = formData.get("sizeBytes");
    const courseId = (String(formData.get("courseId") || "").trim() || null) as string | null;
    const lessonId = (String(formData.get("lessonId") || "").trim() || null) as string | null;
    const userId = (String(formData.get("userId") || "").trim() || null) as string | null;

    if (!key && !url) {
        throw new Error("Provide at least a key or a URL.");
    }

    await prisma.media.create({
        data: {
            kind,
            key: key || (url ?? ""),
            url,
            mime,
            width: widthRaw ? Number(widthRaw) : null,
            height: heightRaw ? Number(heightRaw) : null,
            sizeBytes: sizeRaw ? Number(sizeRaw) : null,
            courseId,
            lessonId,
            userId,
        },
    });

    revalidatePath("/admin/media");
}

async function softDeleteMediaAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") || "");
    if (!id) throw new Error("Missing id");

    await prisma.media.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    revalidatePath("/admin/media");
}

async function restoreMediaAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") || "");
    if (!id) throw new Error("Missing id");

    await prisma.media.update({
        where: { id },
        data: { deletedAt: null },
    });

    revalidatePath("/admin/media");
}

/* --------------------------- helpers --------------------------- */

function fmtBytes(n: number | null): string {
    if (!n || n <= 0) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let val = n;
    while (val >= 1024 && idx < units.length - 1) {
        val /= 1024;
        idx++;
    }
    return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

/* ---------------------------- page ----------------------------- */

export default async function AdminMediaPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    await requireAdminOrNotFound();
    const { q = "", kind = "", page = "1", includeDeleted } = await searchParams;

    const currentPage = Math.max(1, Number.isFinite(Number(page)) ? Number(page) : 1);
    const take = 24;
    const skip = (currentPage - 1) * take;

    const where: any = {
        AND: [
            q
                ? {
                    OR: [
                        { key: { contains: q, mode: "insensitive" as any } },
                        { url: { contains: q, mode: "insensitive" as any } },
                        { mime: { contains: q, mode: "insensitive" as any } },
                    ],
                }
                : {},
            kind ? { kind } : {},
            includeDeleted === "1" ? {} : { deletedAt: null as Date | null },
        ],
    };

    const [rows, total] = await Promise.all([
        prisma.media.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                kind: true,
                key: true,
                url: true,
                width: true,
                height: true,
                sizeBytes: true,
                mime: true,
                courseId: true,
                lessonId: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                deletedAt: true,
            },
        }),
        prisma.media.count({ where }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h1 className="text-xl font-semibold">Media Library</h1>
                <form className="flex flex-wrap items-center gap-2">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search key, URL, or mime…"
                        className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm"
                    />
                    <select
                        name="kind"
                        defaultValue={kind}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Kind"
                    >
                        <option value="">All kinds</option>
                        <option value="image">Images</option>
                        <option value="video">Videos</option>
                        <option value="other">Other</option>
                    </select>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            name="includeDeleted"
                            value="1"
                            defaultChecked={includeDeleted === "1"}
                        />
                        Show deleted
                    </label>
                    <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                        Apply
                    </button>
                </form>
            </div>

            {/* Add media (by URL for now) */}
            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Add media (URL)</h2>
                <p className="mt-1 text-xs text-slate-500">
                    This simple form creates a Media record. Later we’ll replace with the presigned upload flow.
                </p>
                <form action={createMediaAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Kind</div>
                        <select name="kind" className="w-full rounded-md border border-slate-200 px-2 py-2">
                            <option value="image">image</option>
                            <option value="video">video</option>
                            <option value="other" defaultValue={"other"}>
                                other
                            </option>
                        </select>
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">URL</div>
                        <input name="url" placeholder="https://cdn.example.com/file.jpg" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Key</div>
                        <input name="key" placeholder="uploads/2025/08/file.jpg" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">MIME</div>
                        <input name="mime" placeholder="image/jpeg" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Width</div>
                        <input type="number" name="width" min={0} className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Height</div>
                        <input type="number" name="height" min={0} className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Size (bytes)</div>
                        <input type="number" name="sizeBytes" min={0} className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Attach to Course (optional)</div>
                        <input name="courseId" placeholder="courseId" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Attach to Lesson (optional)</div>
                        <input name="lessonId" placeholder="lessonId" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Attach to User (optional)</div>
                        <input name="userId" placeholder="userId" className="w-full rounded-md border border-slate-200 px-3 py-2" />
                    </label>

                    <div className="sm:col-span-2 lg:col-span-3">
                        <button className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                            Create
                        </button>
                    </div>
                </form>
            </section>

            {/* Grid/List */}
            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Library</h2>
                    <span className="text-sm text-slate-600">
                        Page {currentPage} of {pages} · {total} files
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="mt-6 rounded-lg border border-dashed border-slate-200 p-8 text-center text-slate-500">
                        No media found.
                    </div>
                ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {rows.map((m: MediaRow) => {
                            const isDeleted = Boolean(m.deletedAt);
                            const meta = [
                                m.mime || "unknown",
                                m.width && m.height ? `${m.width}×${m.height}` : "",
                                fmtBytes(m.sizeBytes),
                            ]
                                .filter(Boolean)
                                .join(" · ");

                            return (
                                <div
                                    key={m.id}
                                    className={`rounded-xl border p-3 ${isDeleted ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white"}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="text-xs text-slate-500">
                                            <div className="font-medium text-slate-700">{m.kind}</div>
                                            <div className="mt-0.5">{meta || "—"}</div>
                                        </div>
                                        <div className="text-xs text-slate-500">{new Date(m.createdAt).toLocaleString()}</div>
                                    </div>

                                    <div className="mt-3">
                                        {m.kind === "image" && m.url ? (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-lg ring-1 ring-slate-200">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={m.url}
                                                    alt={m.key}
                                                    className="h-full w-full object-cover"
                                                    loading="lazy"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex h-28 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-500 ring-1 ring-slate-200">
                                                {m.kind.toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-3 text-xs">
                                        <div className="truncate text-slate-700">
                                            <span className="font-medium">Key:</span> {m.key || "—"}
                                        </div>
                                        <div className="truncate text-slate-700">
                                            <span className="font-medium">URL:</span>{" "}
                                            {m.url ? (
                                                <a href={m.url} className="text-indigo-600 hover:underline" target="_blank">
                                                    {m.url}
                                                </a>
                                            ) : (
                                                "—"
                                            )}
                                        </div>
                                        <div className="mt-1 grid grid-cols-3 gap-2 text-slate-600">
                                            <div>Course: {m.courseId ? <Link href={`/admin/courses/${m.courseId}`} className="text-indigo-600 hover:underline">{m.courseId}</Link> : "—"}</div>
                                            <div>Lesson: {m.lessonId ?? "—"}</div>
                                            <div>User: {m.userId ?? "—"}</div>
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center gap-2">
                                        {!isDeleted ? (
                                            <form action={softDeleteMediaAction}>
                                                <input type="hidden" name="id" value={m.id} />
                                                <button
                                                    className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                                                    onClick={(e) => {
                                                        if (!confirm("Delete this file (soft delete)?")) e.preventDefault();
                                                    }}
                                                >
                                                    Delete
                                                </button>
                                            </form>
                                        ) : (
                                            <form action={restoreMediaAction}>
                                                <input type="hidden" name="id" value={m.id} />
                                                <button className="rounded-md border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                                                    Restore
                                                </button>
                                            </form>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {pages > 1 && (
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <div className="text-slate-600">
                            Showing {rows.length} of {total}
                        </div>
                        <div className="flex items-center gap-2">
                            {currentPage > 1 && (
                                <a
                                    className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                    href={`?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&includeDeleted=${includeDeleted === "1" ? "1" : ""}&page=${currentPage - 1}`}
                                >
                                    ← Prev
                                </a>
                            )}
                            {currentPage < pages && (
                                <a
                                    className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                    href={`?q=${encodeURIComponent(q)}&kind=${encodeURIComponent(kind)}&includeDeleted=${includeDeleted === "1" ? "1" : ""}&page=${currentPage + 1}`}
                                >
                                    Next →
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}