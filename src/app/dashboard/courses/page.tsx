// src/app/dashboard/courses/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Sparkles } from "lucide-react";

/* ------------ helpers ------------ */
function pct(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

/* ------------ types used locally (keeps TS happy) ------------ */
type EnrollmentRow = {
    courseId: string;
    course: { id: string; slug: string | null; title: string; totalLessons: number | null };
};
type GroupedRow = { courseId: string; _count: { _all: number } };

export const metadata: Metadata = {
    title: "My Courses – DirectPlay",
};

export default async function MyCoursesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");
    const userId = (session.user as unknown as { id: string }).id;

    // Get enrollments with course info
    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, slug: true, title: true, totalLessons: true } } },
        orderBy: { startedAt: "asc" },
    });

    // Compute completed lessons per course
    const courseIds = (enrollments as EnrollmentRow[]).map(
        (e: EnrollmentRow) => e.courseId
    );

    let grouped: GroupedRow[] = [];
    if (courseIds.length) {
        const raw = await prisma.lessonProgress.groupBy({
            by: ["courseId"],
            where: { userId, completed: true, courseId: { in: courseIds } },
            _count: { _all: true },
        });
        grouped = raw.map((r: { courseId: string; _count: { _all: number } }) => ({
            courseId: r.courseId,
            _count: { _all: r._count._all },
        }));
    }

    const doneMap = new Map<string, number>(
        grouped.map((g: GroupedRow) => [g.courseId, g._count._all])
    );

    return (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Courses</h1>
                    <p className="mt-1 text-slate-600">Continue where you left off.</p>
                </div>
                <Link href="/courses" className="text-indigo-600 hover:text-indigo-700">
                    Browse all courses →
                </Link>
            </header>

            {enrollments.length === 0 ? (
                <section className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
                    <div className="flex items-start gap-3">
                        <Sparkles className="h-5 w-5 text-indigo-600" aria-hidden />
                        <div>
                            <h2 className="font-semibold">You’re not enrolled yet</h2>
                            <p className="mt-1 text-sm text-slate-600">
                                Pick a course to get started. Your progress will appear here.
                            </p>
                            <div className="mt-4">
                                <Link
                                    href="/courses"
                                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800"
                                >
                                    Explore courses
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            ) : (
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(enrollments as EnrollmentRow[]).map((enr: EnrollmentRow) => {
                        const total = enr.course.totalLessons ?? 0;
                        const done = doneMap.get(enr.courseId) ?? 0;
                        const percent = total > 0 ? pct((done / total) * 100) : 0;

                        return (
                            <article
                                key={enr.courseId}
                                className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold leading-tight">{enr.course.title}</h3>
                                    {total > 0 && (
                                        <span className="text-xs text-slate-600">
                                            {done}/{total}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                                        style={{ width: `${percent}%` }}
                                        aria-label={`${enr.course.title} ${percent}% complete`}
                                    />
                                </div>

                                <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                                    <div>{percent}% complete</div>
                                    <Link
                                        href={`/learn/${enr.course.slug ?? enr.courseId}`}
                                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                                    >
                                        Continue →
                                    </Link>
                                </div>
                            </article>
                        );
                    })}
                </section>
            )}
        </main>
    );
}