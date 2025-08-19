// src/app/admin/enrollments/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import type { MouseEvent } from "react";

export const dynamic = "force-dynamic";

type SimpleUser = { id: string; name: string | null; email: string | null };
type SimpleCourse = { id: string; title: string; slug: string };

/* -------------------------- server actions -------------------------- */

export async function createEnrollmentAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const userId = String(formData.get("userId") ?? "").trim();
    const courseId = String(formData.get("courseId") ?? "").trim();

    if (!userId || !courseId) {
        throw new Error("userId and courseId are required.");
    }

    // ensure both exist
    const [user, course] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
        prisma.course.findUnique({ where: { id: courseId }, select: { id: true } }),
    ]);
    if (!user) throw new Error("User not found.");
    if (!course) throw new Error("Course not found.");

    try {
        await prisma.enrollment.create({
            data: { userId, courseId },
        });
    } catch (e: unknown) {
        // unique constraint (userId, courseId) → ignore with friendly message
        // We don’t throw to keep UX simple.
    }

    revalidatePath("/admin/enrollments");
}

export async function deleteEnrollmentAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const id = String(formData.get("id") ?? "");
    if (!id) throw new Error("Enrollment id is required");

    await prisma.enrollment.delete({ where: { id } });
    revalidatePath("/admin/enrollments");
}

/** Optional: wipe all LessonProgress rows for a user+course (reset progress). */
export async function resetProgressAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const userId = String(formData.get("userId") ?? "");
    const courseId = String(formData.get("courseId") ?? "");
    if (!userId || !courseId) throw new Error("userId and courseId are required");

    await prisma.lessonProgress.deleteMany({ where: { userId, courseId } });
    revalidatePath("/admin/enrollments");
}

/* ------------------------------ types ------------------------------ */

type SearchParams = {
    q?: string;
    user?: string;   // userId
    course?: string; // courseId
    page?: string;
};

type Row = {
    id: string;
    startedAt: Date;
    user: { id: string; name: string | null; email: string | null };
    course: { id: string; title: string; slug: string };
};

/* -------------------------------- page ----------------------------- */

export default async function AdminEnrollments({
    searchParams,
}: {
    searchParams?: SearchParams;
}) {
    await requireAdminOrNotFound();

    const params: SearchParams = searchParams ?? {};
    const q: string = params.q ?? "";
    const userIdFilter: string | null = params.user ?? null;
    const courseIdFilter: string | null = params.course ?? null;

    const currentPage: number = Math.max(
        1,
        Number.isFinite(Number(params.page)) ? Number(params.page) : 1
    );
    const take = 20;
    const skip = (currentPage - 1) * take;

    // Build where clause (use Prisma input type directly to avoid 'unknown' issues)
    const where = {
        ...(userIdFilter ? { userId: userIdFilter } : {}),
        ...(courseIdFilter ? { courseId: courseIdFilter } : {}),
        ...(q
            ? {
                OR: [
                    { user: { name: { contains: q, mode: "insensitive" } } },
                    { user: { email: { contains: q, mode: "insensitive" } } },
                    { course: { title: { contains: q, mode: "insensitive" } } },
                    { course: { slug: { contains: q, mode: "insensitive" } } },
                ],
            }
            : {}),
    };

    const [rowsRaw, total, usersRaw, coursesRaw] = await Promise.all([
        prisma.enrollment.findMany({
            where: where as any,
            orderBy: { startedAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                startedAt: true,
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true, slug: true } },
            },
        }),
        prisma.enrollment.count({ where: where as any }),
        // for filter dropdowns / create form
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 100,
            select: { id: true, name: true, email: true },
        }),
        prisma.course.findMany({
            orderBy: { title: "asc" },
            take: 100,
            select: { id: true, title: true, slug: true },
        }),
    ]);
    const rows: Row[] = rowsRaw as unknown as Row[];
    const users: SimpleUser[] = usersRaw as unknown as SimpleUser[];
    const courses: SimpleCourse[] = coursesRaw as unknown as SimpleCourse[];

    const pages: number = Math.max(1, Math.ceil(total / take));

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="font-semibold">Enrollments</h2>

                <form className="flex flex-wrap items-center gap-2">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search user or course…"
                        className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm"
                    />

                    <select
                        name="user"
                        defaultValue={userIdFilter ?? ""}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Filter by user"
                    >
                        <option value="">All users</option>
                        {users.map((u: SimpleUser) => (
                            <option key={u.id} value={u.id}>
                                {u.name ?? u.email ?? u.id}
                            </option>
                        ))}
                    </select>

                    <select
                        name="course"
                        defaultValue={courseIdFilter ?? ""}
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

                    <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                        Apply
                    </button>
                </form>
            </div>

            {/* Create enrollment */}
            <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <h3 className="font-medium">Create enrollment</h3>
                <form action={createEnrollmentAction} className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">User</div>
                        <select name="userId" className="w-full rounded-md border border-slate-300 px-2 py-1.5" required>
                            <option value="">Select user…</option>
                            {users.map((u: SimpleUser) => (
                                <option key={u.id} value={u.id}>
                                    {u.name ? `${u.name} – ${u.email ?? ""}` : u.email ?? u.id}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Course</div>
                        <select name="courseId" className="w-full rounded-md border border-slate-300 px-2 py-1.5" required>
                            <option value="">Select course…</option>
                            {courses.map((c: SimpleCourse) => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.slug})
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="flex items-end">
                        <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                            Add enrollment
                        </button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Course</th>
                            <th className="px-3 py-2">Started</th>
                            <th className="px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r: Row) => (
                            <tr key={r.id} className="border-t border-slate-200">
                                <td className="px-3 py-2">{r.user.name ?? "—"}</td>
                                <td className="px-3 py-2">{r.user.email ?? "—"}</td>
                                <td className="px-3 py-2">
                                    <Link className="hover:underline" href={`/admin/courses/${r.course.id}`}>
                                        {r.course.title}
                                    </Link>
                                    <div className="text-xs text-slate-500">{r.course.slug}</div>
                                </td>
                                <td className="px-3 py-2">
                                    {new Date(r.startedAt).toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex items-center gap-2">
                                        <form action={resetProgressAction}>
                                            <input type="hidden" name="userId" value={r.user.id} />
                                            <input type="hidden" name="courseId" value={r.course.id} />
                                            <button
                                                type="submit"
                                                className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50"
                                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                    if (!confirm("Reset this user’s progress for the course?"))
                                                        e.preventDefault();
                                                }}
                                            >
                                                Reset progress
                                            </button>
                                        </form>

                                        <form action={deleteEnrollmentAction}>
                                            <input type="hidden" name="id" value={r.id} />
                                            <button
                                                type="submit"
                                                className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                                                onClick={(e: MouseEvent<HTMLButtonElement>) => {
                                                    if (!confirm("Remove this enrollment?")) e.preventDefault();
                                                }}
                                            >
                                                Remove
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                                    No enrollments found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                        Page {currentPage} of {pages} · {total} enrollments
                    </span>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter ?? ""
                                )}&course=${encodeURIComponent(courseIdFilter ?? "")}&page=${currentPage - 1}`}
                            >
                                ← Prev
                            </a>
                        )}
                        {currentPage < pages && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter ?? ""
                                )}&course=${encodeURIComponent(courseIdFilter ?? "")}&page=${currentPage + 1}`}
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