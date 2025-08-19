// src/app/admin/notes/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import type { MouseEvent } from "react";

export const dynamic = "force-dynamic";

/* -------------------------- server actions -------------------------- */

export async function softDeleteNoteAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Note id is required.");

    await prisma.lessonNote.update({
        where: { id },
        data: { deletedAt: new Date() },
    });

    revalidatePath("/admin/notes");
}

export async function restoreNoteAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Note id is required.");

    await prisma.lessonNote.update({
        where: { id },
        data: { deletedAt: null },
    });

    revalidatePath("/admin/notes");
}

export async function hardDeleteNoteAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Note id is required.");

    await prisma.lessonNote.delete({ where: { id } });
    revalidatePath("/admin/notes");
}

/* ------------------------------ types ------------------------------ */

type SearchParams = {
    q?: string;          // free text: user name/email, course title/slug, lesson title, content
    user?: string;       // userId
    course?: string;     // courseId
    includeDeleted?: string; // "1" to include soft-deleted
    page?: string;
};

type SimpleUser = { id: string; name: string | null; email: string | null };
type SimpleCourse = { id: string; title: string; slug: string };

type Row = {
    id: string;
    content: string;
    updatedAt: Date;
    deletedAt: Date | null;
    user: SimpleUser;
    course: SimpleCourse;
    lesson: { id: string; title: string };
};

/* -------------------------------- page ----------------------------- */

export default async function AdminNotes({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    await requireAdminOrNotFound();

    const params: SearchParams = searchParams ?? {};
    const q = params.q ?? "";
    const userIdFilter = params.user ?? "";
    const courseIdFilter = params.course ?? "";
    const includeDeleted = (params.includeDeleted ?? "") === "1";

    const currentPage = Math.max(
        1,
        Number.isFinite(Number(params.page)) ? Number(params.page) : 1
    );
    const take = 20;
    const skip = (currentPage - 1) * take;

    // where clause (kept untyped to avoid Prisma version TS mismatches)
    const where: any = {
        ...(userIdFilter ? { userId: userIdFilter } : {}),
        ...(courseIdFilter ? { courseId: courseIdFilter } : {}),
        ...(includeDeleted ? {} : { deletedAt: null }),
        ...(q
            ? {
                OR: [
                    { content: { contains: q, mode: "insensitive" } },
                    { lesson: { title: { contains: q, mode: "insensitive" } } },
                    { course: { title: { contains: q, mode: "insensitive" } } },
                    { course: { slug: { contains: q, mode: "insensitive" } } },
                    { user: { email: { contains: q, mode: "insensitive" } } },
                    { user: { name: { contains: q, mode: "insensitive" } } },
                ],
            }
            : {}),
    };

    const [rows, total, users, courses] = await Promise.all([
        prisma.lessonNote.findMany({
            where: where as any,
            orderBy: { updatedAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                content: true,
                updatedAt: true,
                deletedAt: true,
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
                lesson: { select: { id: true, title: true } },
            },
        }) as unknown as Row[],
        prisma.lessonNote.count({ where: where as any }),
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, name: true, email: true },
        }),
        prisma.course.findMany({
            orderBy: { title: "asc" },
            take: 200,
            select: { id: true, title: true, slug: true },
        }),
    ]);

    const pages = Math.max(1, Math.ceil(total / take));

    const excerpt = (text: string, max = 140) =>
        text.length <= max ? text : text.slice(0, max).trimEnd() + "…";

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="font-semibold">Notes (Moderation)</h2>

                <form className="flex flex-wrap items-center gap-2">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search content, user, course…"
                        className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm"
                    />

                    <select
                        name="user"
                        defaultValue={userIdFilter}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Filter by user"
                    >
                        <option value="">All users</option>
                        {users.map((u: SimpleUser) => (
                            <option key={u.id} value={u.id}>
                                {u.name ? `${u.name} – ${u.email ?? ""}` : u.email ?? u.id}
                            </option>
                        ))}
                    </select>

                    <select
                        name="course"
                        defaultValue={courseIdFilter}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Filter by course"
                    >
                        <option value="">All courses</option>
                        {courses.map((c: SimpleCourse) => (
                            <option key={c.id} value={c.id}>
                                {c.title}
                            </option>
                        ))}
                    </select>

                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            name="includeDeleted"
                            value="1"
                            defaultChecked={includeDeleted}
                            className="h-4 w-4"
                        />
                        Show deleted
                    </label>

                    <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                        Apply
                    </button>
                </form>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Course / Lesson</th>
                            <th className="px-3 py-2">Content</th>
                            <th className="px-3 py-2">Updated</th>
                            <th className="px-3 py-2">State</th>
                            <th className="px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(() => {
                            const typedRows: Row[] = rows as Row[];
                            return typedRows.map((r: Row) => (
                                <tr key={r.id} className="border-t border-slate-200 align-top">
                                    <td className="px-3 py-2">
                                        <div>{r.user.name ?? "—"}</div>
                                        <div className="text-xs text-slate-500">
                                            {r.user.email ?? r.user.id}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Link
                                            className="font-medium hover:underline"
                                            href={`/admin/courses/${r.course.id}`}
                                        >
                                            {r.course.title}
                                        </Link>
                                        <div className="text-xs text-slate-500">{r.course.slug}</div>
                                        <div className="mt-1 text-xs text-slate-600">
                                            Lesson: {r.lesson.title}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="max-w-xl whitespace-pre-wrap break-words">
                                            {excerpt(r.content)}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2">
                                        {new Date(r.updatedAt).toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2">
                                        {r.deletedAt ? (
                                            <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-700 ring-1 ring-amber-200">
                                                Deleted
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-200">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            {r.deletedAt ? (
                                                <form action={restoreNoteAction} className="inline">
                                                    <input type="hidden" name="id" value={r.id} />
                                                    <button className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50">
                                                        Restore
                                                    </button>
                                                </form>
                                            ) : (
                                                <form action={softDeleteNoteAction} className="inline">
                                                    <input type="hidden" name="id" value={r.id} />
                                                    <button
                                                        className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                                                        onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                            if (!confirm("Delete this note (soft-delete)?"))
                                                                e.preventDefault();
                                                        }}
                                                    >
                                                        Delete
                                                    </button>
                                                </form>
                                            )}

                                            <form action={hardDeleteNoteAction} className="inline">
                                                <input type="hidden" name="id" value={r.id} />
                                                <button
                                                    className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-800 hover:bg-red-50"
                                                    onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                        if (
                                                            !confirm(
                                                                "Permanently delete this note? This cannot be undone."
                                                            )
                                                        )
                                                            e.preventDefault();
                                                    }}
                                                >
                                                    Hard delete
                                                </button>
                                            </form>
                                        </div>
                                    </td>
                                </tr>
                            ));
                        })()}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                                    No notes found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                        Page {currentPage} of {pages} · {total} notes
                    </span>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter
                                )}&course=${encodeURIComponent(
                                    courseIdFilter
                                )}&includeDeleted=${includeDeleted ? "1" : ""}&page=${currentPage - 1
                                    }`}
                            >
                                ← Prev
                            </a>
                        )}
                        {currentPage < pages && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter
                                )}&course=${encodeURIComponent(
                                    courseIdFilter
                                )}&includeDeleted=${includeDeleted ? "1" : ""}&page=${currentPage + 1
                                    }`}
                            >
                                Next →
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}