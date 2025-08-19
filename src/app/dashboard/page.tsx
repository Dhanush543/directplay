//src//app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    ArrowRight,
    BookOpen,
    Clock4,
    Mail,
    ShieldCheck,
    Sparkles,
    TrendingUp,
    ChevronRight,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import Celebration from "@/components/dashboard/Celebration";

/* ---------------- helpers ---------------- */

function clampPct(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}
function formatStudy(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h && m) return `${h}h ${m}m`;
    if (h) return `${h}h`;
    return `${m}m`;
}

/* ---------------- types ---------------- */

type ProgressRow = {
    slug: string;
    title: string;
    pct: number;
    total: number;
    done: number;
    /** 1-based index of the next unlocked lesson. null → course finished or no lessons. */
    nextIndex: number | null;
};

type RecentRow = { id: string; title: string; meta: string | null };

type NextLesson = {
    courseSlug: string;
    courseTitle: string;
    lessonIndex: number;
    lessonTitle: string;
} | null;

type LastWatched = {
    courseSlug: string;
    courseTitle: string;
    lessonIndex: number;
    lessonTitle: string;
    updatedAt: Date;
} | null;

type Suggestion = {
    slug: string;
    title: string;
    level: string | null;
    durationHours: number | null;
    description: string | null;
};

type RecentNote = {
    id: string;
    courseSlug: string;
    courseTitle: string;
    lessonIndex: number;
    lessonTitle: string;
    updatedAt: Date;
};

type DashboardData = {
    lessonsCompleted: number;
    studySeconds: number;
    streak: number;
    progress: ProgressRow[];
    recent: RecentRow[];
    nextLesson: NextLesson;
    lastWatched: LastWatched;
    suggestions: Suggestion[];
    notes: RecentNote[];
};

type Stat = {
    label: string;
    value: string;
    delta?: string;
    icon: React.ReactNode;
};

/* explicit row shapes read from Prisma */
type StreakRow = { day: Date };
type EnrollmentRow = {
    courseId: string;
    course: { id: string; title: string; slug: string };
};
type GroupedRow = { courseId: string; _count: { _all: number } };
type NotificationRow = {
    id: string;
    title: string;
    meta: string | null;
    type: "auth" | "email" | "system";
};

/* ---------------- cached server loader ---------------- */

const emptyData: DashboardData = {
    lessonsCompleted: 0,
    studySeconds: 0,
    streak: 0,
    progress: [],
    recent: [],
    nextLesson: null,
    lastWatched: null,
    suggestions: [],
    notes: [],
};

const getDashboardData = unstable_cache(
    async (userId: string): Promise<DashboardData> => {
        try {
            // lessons completed
            const lessonsCompleted = await prisma.lessonProgress.count({
                where: { userId, completed: true },
            });

            // study seconds
            const { _sum } = await prisma.lessonProgress.aggregate({
                where: { userId, completed: true },
                _sum: { durationSeconds: true },
            });
            const studySeconds = _sum.durationSeconds ?? 0;

            // streak from last 60 days (simple contiguous day count)
            const days = (await prisma.streakLog.findMany({
                where: { userId },
                orderBy: { day: "desc" },
                take: 60,
                select: { day: true },
            })) as StreakRow[];

            const dates = new Set(days.map((d) => new Date(d.day).toISOString().slice(0, 10)));
            let streak = 0;
            let cursor = new Date();
            if (!dates.has(cursor.toISOString().slice(0, 10))) {
                cursor.setDate(cursor.getDate() - 1);
            }
            for (let i = 0; i < 365; i++) {
                const key = cursor.toISOString().slice(0, 10);
                if (!dates.has(key)) break;
                streak++;
                cursor.setDate(cursor.getDate() - 1);
            }

            // enrollments (with slug for linking)
            const enrollments = (await prisma.enrollment.findMany({
                where: { userId },
                include: { course: { select: { id: true, title: true, slug: true } } },
                orderBy: { startedAt: "asc" },
            })) as EnrollmentRow[];

            const courseIds = enrollments.map((e) => e.course.id);

            // completed counts by course
            let grouped: GroupedRow[] = [];
            if (courseIds.length > 0) {
                const raw = await prisma.lessonProgress.groupBy({
                    by: ["courseId"],
                    where: { userId, completed: true, courseId: { in: courseIds } },
                    _count: { _all: true },
                });
                // Normalize the Prisma return to our local `GroupedRow` shape
                grouped = (raw as any[]).map((r) => ({
                    courseId: String((r as any).courseId),
                    _count: { _all: Number((r as any)._count?._all ?? 0) },
                }));
            }

            const completedMap = new Map<string, number>();
            for (const g of grouped) completedMap.set(g.courseId, g._count._all);

            // totals + per-course next lesson (1-based)
            const totalsMap = new Map<string, number>();
            const nextIndexMap = new Map<string, number | null>();

            for (const { course } of enrollments) {
                const total = await prisma.lesson.count({ where: { courseId: course.id } });
                totalsMap.set(course.id, total);

                if (total === 0) {
                    nextIndexMap.set(course.id, null);
                    continue;
                }

                const next = await prisma.lesson.findFirst({
                    where: {
                        courseId: course.id,
                        progress: { none: { userId, completed: true } },
                    },
                    orderBy: { index: "asc" },
                    select: { index: true },
                });
                nextIndexMap.set(course.id, next ? next.index : null);
            }

            const progress: ProgressRow[] = enrollments.map((e) => {
                const total = totalsMap.get(e.course.id) ?? 0;
                const done = completedMap.get(e.course.id) ?? 0;
                const ratio = total > 0 ? Math.round((done / total) * 100) : 0;
                return {
                    slug: e.course.slug,
                    title: e.course.title,
                    pct: ratio,
                    total,
                    done,
                    nextIndex: nextIndexMap.get(e.course.id) ?? null,
                };
            });

            // next lesson across all enrollments (first uncompleted by enrollment order)
            let nextLesson: NextLesson = null;
            for (const e of enrollments) {
                const next = await prisma.lesson.findFirst({
                    where: {
                        courseId: e.course.id,
                        progress: { none: { userId, completed: true } },
                    },
                    orderBy: { index: "asc" },
                    select: { index: true, title: true },
                });
                if (next) {
                    nextLesson = {
                        courseSlug: e.course.slug,
                        courseTitle: e.course.title,
                        lessonIndex: next.index,
                        lessonTitle: next.title,
                    };
                    break;
                }
            }

            // last watched lesson (most recently updated)
            const last = await prisma.lessonProgress.findFirst({
                where: { userId },
                orderBy: { updatedAt: "desc" },
                include: {
                    lesson: {
                        select: {
                            index: true,
                            title: true,
                            course: { select: { slug: true, title: true } },
                        },
                    },
                },
            });

            const lastWatched: LastWatched = last
                ? {
                    courseSlug: last.lesson.course.slug,
                    courseTitle: last.lesson.course.title,
                    lessonIndex: last.lesson.index,
                    lessonTitle: last.lesson.title,
                    updatedAt: last.updatedAt,
                }
                : null;

            // suggestions: published + active courses not enrolled
            const suggestions = await prisma.course.findMany({
                where: {
                    published: true,
                    comingSoon: false,
                    id: { notIn: courseIds.length ? courseIds : ["_none_"] },
                },
                orderBy: { title: "asc" },
                take: 2,
                select: {
                    slug: true,
                    title: true,
                    level: true,
                    durationHours: true,
                    description: true,
                },
            });

            // notifications
            const recentRows = (await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, title: true, meta: true, type: true },
            })) as NotificationRow[];

            const recent: RecentRow[] = recentRows.map((n) => ({
                id: n.id,
                title: n.title,
                meta: n.meta ?? (n.type === "auth" ? "Auth" : n.type === "email" ? "Email" : "System"),
            }));

            // recent notes
            type NoteRow = {
                id: string;
                updatedAt: Date;
                lesson: {
                    index: number;
                    title: string;
                    course: { slug: string; title: string };
                };
            };

            const notesRows = (await prisma.lessonNote.findMany({
                where: { userId },
                orderBy: { updatedAt: "desc" },
                take: 3,
                select: {
                    id: true,
                    updatedAt: true,
                    lesson: {
                        select: {
                            index: true,
                            title: true,
                            course: { select: { slug: true, title: true } },
                        },
                    },
                },
            })) as NoteRow[];

            const notes: RecentNote[] = notesRows.map((n) => ({
                id: n.id,
                updatedAt: n.updatedAt,
                courseSlug: n.lesson.course.slug,
                courseTitle: n.lesson.course.title,
                lessonIndex: n.lesson.index,
                lessonTitle: n.lesson.title,
            }));

            return {
                lessonsCompleted,
                studySeconds,
                streak,
                progress,
                recent,
                nextLesson,
                lastWatched,
                suggestions,
                notes,
            };
        } catch {
            return emptyData;
        }
    },
    ["dashboard"],
    { revalidate: 30, tags: ["dashboard"] }
);

/* ---------------- page ---------------- */

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");
    const userId = (session.user as { id: string }).id;

    const data = await getDashboardData(userId);

    const displayName = session.user.name || session.user.email?.split("@")[0] || "there";

    const stats: Stat[] = [
        {
            label: "Lessons completed",
            value: data.lessonsCompleted.toString(),
            icon: <BookOpen className="h-4 w-4" aria-hidden />,
        },
        {
            label: "Study time",
            value: formatStudy(data.studySeconds),
            icon: <Clock4 className="h-4 w-4" aria-hidden />,
        },
        {
            label: "Streak",
            value: `${data.streak} ${data.streak === 1 ? "day" : "days"}`,
            delta: data.streak > 0 ? "Keep it going" : "Start today",
            icon: <TrendingUp className="h-4 w-4" aria-hidden />,
        },
    ];

    const startLearningHref =
        data.nextLesson?.courseSlug
            ? `/learn/${data.nextLesson.courseSlug}?lesson=${data.nextLesson.lessonIndex}`
            : "/courses";

    // build a quick set of fully-finished course slugs (nextIndex === null and total>0)
    const finishedSlugs = new Set(
        data.progress.filter((p) => p.total > 0 && p.nextIndex === null).map((p) => p.slug)
    );

    const shouldHideResume =
        !!data.lastWatched && finishedSlugs.has(data.lastWatched.courseSlug);

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-8 mx-auto w-full max-w-6xl">
            {/* header */}
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome back,{" "}
                        <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">
                            {displayName}
                        </span>{" "}
                        👋
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Pick up where you left off, keep your streak alive, and ship something today.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href={startLearningHref}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800 transition"
                    >
                        Start learning <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </div>
            </header>

            {/* stats + streak nudge */}
            <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-slate-500 text-sm">{s.label}</div>
                            <div className="text-slate-500">{s.icon}</div>
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{s.value}</div>
                        {!!s.delta && <div className="mt-1 text-xs text-emerald-600">{s.delta}</div>}
                        {s.label === "Streak" && data.streak === 0 && (
                            <div className="mt-2 text-xs text-slate-500">
                                Watch any 10-minute lesson to start your streak today.
                            </div>
                        )}
                    </div>
                ))}
            </section>

            {/* resume + suggestions */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* progress */}
                <section className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden />
                        <h2 className="font-semibold">Your learning progress</h2>
                    </div>

                    {/* Celebration if fully done */}
                    {(!data.lastWatched || shouldHideResume) && finishedSlugs.size > 0 && (
                        <Celebration
                            title="All caught up — nice work!"
                            subtitle="You’ve completed your current course."
                            ctaLabel="Explore projects"
                            ctaHref="/projects"
                            className="mt-3"
                        />
                    )}

                    {/* Resume last watched (only if not fully complete) */}
                    {!shouldHideResume && data.lastWatched && (
                        <div className="mt-3 rounded-lg border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm">
                                <div className="font-medium">Resume last watched</div>
                                <div className="text-slate-600">
                                    {data.lastWatched.courseTitle} — Lesson {data.lastWatched.lessonIndex}:{" "}
                                    {data.lastWatched.lessonTitle}
                                </div>
                            </div>
                            <Link
                                href={`/learn/${data.lastWatched.courseSlug}?lesson=${data.lastWatched.lessonIndex}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3 py-2 hover:bg-slate-800"
                            >
                                Continue <ArrowRight className="h-4 w-4" aria-hidden />
                            </Link>
                        </div>
                    )}

                    {data.progress.length === 0 ? (
                        <div className="mt-4 text-sm text-slate-600">
                            You’re not enrolled in any courses yet.{" "}
                            <Link href="/#courses" className="text-indigo-600 hover:text-indigo-700">
                                Browse courses →
                            </Link>
                        </div>
                    ) : (
                        <ul className="mt-4 space-y-3">
                            {data.progress.map((p) => {
                                const href =
                                    p.nextIndex && p.nextIndex > 0
                                        ? `/learn/${p.slug}?lesson=${p.nextIndex}`
                                        : `/learn/${p.slug}`;
                                const finished = p.total > 0 && p.nextIndex === null;

                                return (
                                    <li key={p.slug}>
                                        <Link
                                            href={href}
                                            className="group block rounded-xl border border-slate-200 p-3 hover:bg-slate-50 transition"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium">
                                                    {p.title}
                                                    {finished && (
                                                        <span className="ml-2 text-xs text-emerald-600 font-semibold">100% complete</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-sm text-slate-600">
                                                        {clampPct(p.pct)}% {p.total ? `(${p.done}/${p.total})` : ""}
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
                                                </div>
                                            </div>
                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                                                    style={{ width: `${clampPct(p.pct)}%` }}
                                                    aria-label={`${p.title} ${clampPct(p.pct)} percent complete`}
                                                />
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    <div className="mt-4 flex justify-end">
                        <Link href="/dashboard/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                            View all courses →
                        </Link>
                    </div>
                </section>

                {/* recent + suggestions + notes */}
                <aside className="space-y-6">
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                        <h2 className="font-semibold">Recent</h2>
                        {data.recent.length === 0 ? (
                            <div className="mt-3 text-sm text-slate-600">You’re all caught up 🎉</div>
                        ) : (
                            <ul className="mt-3 divide-y divide-slate-200">
                                {data.recent.map((r) => (
                                    <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1 text-slate-500">
                                                {r.meta?.startsWith("Email") ? (
                                                    <Mail className="h-4 w-4" aria-hidden />
                                                ) : r.meta?.startsWith("Auth") ? (
                                                    <ShieldCheck className="h-4 w-4" aria-hidden />
                                                ) : (
                                                    <Sparkles className="h-4 w-4" aria-hidden />
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium">{r.title}</div>
                                                <div className="text-xs text-slate-500">{r.meta}</div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="mt-4">
                            <Link href="/notifications" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                                See all notifications →
                            </Link>
                        </div>
                    </div>

                    {/* Suggestions */}
                    {data.suggestions.length > 0 && (
                        <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                            <h2 className="font-semibold">Recommended for you</h2>
                            <ul className="mt-3 space-y-3">
                                {data.suggestions.map((c) => (
                                    <li key={c.slug} className="rounded-lg border border-slate-200 p-3">
                                        <div className="font-medium">{c.title}</div>
                                        <div className="text-xs text-slate-600">
                                            {c.level ? `${c.level} · ` : ""}
                                            {c.durationHours ? `${c.durationHours} hrs` : ""}
                                        </div>
                                        {c.description && (
                                            <div className="mt-1 text-sm text-slate-600 line-clamp-2">{c.description}</div>
                                        )}
                                        <div className="mt-2">
                                            <Link href={`/courses/${c.slug}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                                                View details →
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Recent notes */}
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                        <h2 className="font-semibold">Recent notes</h2>
                        {data.notes.length === 0 ? (
                            <div className="mt-3 text-sm text-slate-600">No notes yet.</div>
                        ) : (
                            <ul className="mt-3 space-y-3">
                                {data.notes.map((n) => (
                                    <li key={n.id} className="rounded-lg border border-slate-200 p-3">
                                        <div className="text-sm">
                                            <span className="font-medium">{n.courseTitle}</span> — Lesson {n.lessonIndex}: {n.lessonTitle}
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">
                                            Updated {new Date(n.updatedAt).toLocaleString()}
                                        </div>
                                        <div className="mt-2">
                                            <Link href={`/learn/${n.courseSlug}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                                                Open course →
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>
            </div>

            {/* quick actions */}
            <section className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 ring-1 ring-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-slate-900">Keep the streak going</h3>
                        <p className="text-sm text-slate-600">
                            {data.nextLesson
                                ? `You can finish “${data.nextLesson.lessonTitle}” from ${data.nextLesson.courseTitle} in ~10 minutes.`
                                : "Do a 10-minute lesson now and maintain your momentum."}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={startLearningHref}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2.5 hover:bg-slate-800"
                        >
                            10-min lesson <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                            Explore projects
                        </Link>
                    </div>
                </div>
            </section>

            {/* Projects (simple: active + coming soon) */}
            <section className="mt-6 space-y-4">
                <div className="flex items-end justify-between">
                    <h2 className="text-lg font-semibold">Explore projects</h2>
                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {/* Active example */}
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-medium">Orders Microservice (Spring Boot)</div>
                            <span className="text-xs text-slate-600">Intermediate</span>
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                            REST API with validation, JPA, and integration tests.
                        </div>
                        <div className="mt-3">
                            <Link
                                href="/projects/spring-microservice-orders"
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                Open project →
                            </Link>
                        </div>
                    </div>

                    {/* Coming soon examples */}
                    {[
                        {
                            title: "Job Portal (Full-stack)",
                            level: "Advanced",
                            copy: "Auth, profiles, search & apply flow. Deployed to the cloud.",
                        },
                        {
                            title: "URL Shortener",
                            level: "Beginner",
                            copy: "Tiny service with redirects, rate-limit & analytics.",
                        },
                    ].map((p) => (
                        <div key={p.title} className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 opacity-80">
                            <div className="flex items-center justify-between">
                                <div className="font-medium">{p.title}</div>
                                <span className="text-xs text-slate-600">{p.level}</span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{p.copy}</div>
                            <div className="mt-3">
                                <button
                                    type="button"
                                    disabled
                                    className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-1.5 text-slate-500 ring-1 ring-slate-200 cursor-not-allowed"
                                    title="Coming soon"
                                >
                                    Coming soon
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </main>
    );
}