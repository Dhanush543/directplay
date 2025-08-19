// src/app/admin/courses/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";

type CourseRow = {
    id: string;
    title: string;
    slug: string;
    level: string | null;
    durationHours: number | null;
    published: boolean;
    comingSoon: boolean;
    _count: { lessons: number; enrollments: number };
};

export const dynamic = "force-dynamic";

/* ---------- actions ---------- */
async function togglePublished(courseId: string, published: boolean) {
    "use server";
    await requireAdminOrNotFound();
    await prisma.course.update({ where: { id: courseId }, data: { published } });
    revalidatePath("/admin/courses");
}

async function toggleComingSoon(courseId: string, comingSoon: boolean) {
    "use server";
    await requireAdminOrNotFound();
    await prisma.course.update({ where: { id: courseId }, data: { comingSoon } });
    revalidatePath("/admin/courses");
}

export default async function AdminCourses() {
    await requireAdminOrNotFound();

    const courses: CourseRow[] = await prisma.course.findMany({
        orderBy: { title: "asc" },
        select: {
            id: true,
            title: true,
            slug: true,
            level: true,
            durationHours: true,
            published: true,
            comingSoon: true,
            _count: { select: { lessons: true, enrollments: true } },
        },
    });

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold">Courses</h2>
                <Link
                    href="/admin/courses/new"
                    className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                >
                    + New course
                </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Slug</th>
                            <th className="px-3 py-2">Level</th>
                            <th className="px-3 py-2">Duration</th>
                            <th className="px-3 py-2">Lessons</th>
                            <th className="px-3 py-2">Enrollments</th>
                            <th className="px-3 py-2">Flags</th>
                            <th className="px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((c: CourseRow) => (
                            <tr key={c.id} className="border-t border-slate-200">
                                <td className="px-3 py-2 font-medium">
                                    <Link className="hover:underline" href={`/admin/courses/${c.id}`}>
                                        {c.title}
                                    </Link>
                                </td>
                                <td className="px-3 py-2 text-slate-600">{c.slug}</td>
                                <td className="px-3 py-2">{c.level ?? "—"}</td>
                                <td className="px-3 py-2">
                                    {c.durationHours ? `${c.durationHours}h` : "—"}
                                </td>
                                <td className="px-3 py-2">{c._count.lessons}</td>
                                <td className="px-3 py-2">{c._count.enrollments}</td>
                                <td className="px-3 py-2">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${c.published
                                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                                : "bg-slate-50 text-slate-700 ring-slate-200"
                                            }`}
                                    >
                                        {c.published ? "Published" : "Hidden"}
                                    </span>
                                    <span
                                        className={`ml-2 inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${c.comingSoon
                                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                                : "bg-slate-50 text-slate-700 ring-slate-200"
                                            }`}
                                    >
                                        {c.comingSoon ? "Coming soon" : "Active"}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    <form
                                        action={async (fd: FormData) => {
                                            "use server";
                                            const id = String(fd.get("id"));
                                            const next = fd.get("next") === "true";
                                            await togglePublished(id, next);
                                        }}
                                        className="inline"
                                    >
                                        <input type="hidden" name="id" value={c.id} />
                                        <input
                                            type="hidden"
                                            name="next"
                                            value={(!c.published).toString()}
                                        />
                                        <button className="mr-2 rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                                            {c.published ? "Unpublish" : "Publish"}
                                        </button>
                                    </form>

                                    <form
                                        action={async (fd: FormData) => {
                                            "use server";
                                            const id = String(fd.get("id"));
                                            const next = fd.get("next") === "true";
                                            await toggleComingSoon(id, next);
                                        }}
                                        className="inline"
                                    >
                                        <input type="hidden" name="id" value={c.id} />
                                        <input
                                            type="hidden"
                                            name="next"
                                            value={(!c.comingSoon).toString()}
                                        />
                                        <button className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
                                            {c.comingSoon ? "Set Active" : "Set Coming Soon"}
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}