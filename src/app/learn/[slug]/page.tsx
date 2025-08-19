// src/app/learn/[slug]/page.tsx
import { safeGetServerSession } from "@/lib/auth"; // ⬅️ use safe helper
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import LearnCourseClient from "@/components/learn/LearnCourseClient";

type Params = { slug: string };
type Search = { lesson?: string };

export const metadata = { title: "Course – DirectPlay" };

function pct(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

export default async function LearnCoursePage({
    params,
    searchParams,
}: {
    params: Promise<Params>;
    searchParams: Promise<Search>;
}) {
    const { slug } = await params;
    const { lesson } = await searchParams;

    const session = await safeGetServerSession();
    if (!session?.user) redirect("/auth?view=signin");
    const userId = (session.user as { id: string }).id;

    const course = await prisma.course.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        select: { id: true, slug: true, title: true },
    });
    if (!course) notFound();

    const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId: course.id },
        select: { id: true },
    });
    if (!enrolled) {
        redirect(`/courses?need_enroll=${encodeURIComponent(course.slug ?? course.id)}`);
    }

    const lessonRows = await prisma.lesson.findMany({
        where: { courseId: course.id },
        orderBy: { index: "asc" },
        select: { id: true, index: true, title: true, videoUrl: true },
    });

    type LessonRow = (typeof lessonRows)[number];
    const total: number = lessonRows.length;

    if (total === 0) {
        return (
            <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h1>
                        <p className="mt-1 text-slate-600">Lessons are not published yet. Check back soon!</p>
                    </div>
                    <Link href="/dashboard/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                        My Courses →
                    </Link>
                </div>
            </main>
        );
    }

    type CompletedRow = { lessonId: string };
    const completed: CompletedRow[] = await prisma.lessonProgress.findMany({
        where: { userId, courseId: course.id, completed: true },
        select: { lessonId: true },
    });
    const completedSet = new Set<string>(completed.map((r: CompletedRow) => r.lessonId));

    type LessonForClient = {
        id: string;
        index: number;
        title: string;
        completed: boolean;
        videoUrl?: string;
    };
    const lessons: LessonForClient[] = lessonRows.map(
        (r: LessonRow): LessonForClient => ({
            id: r.id,
            index: r.index,
            title: r.title,
            completed: completedSet.has(r.id),
            videoUrl: r.videoUrl ?? undefined,
        })
    );

    const done: number = lessons.filter((l) => l.completed).length;
    const _progress = { done, total, pct: total > 0 ? pct((done / total) * 100) : 0 };

    const lastCompletedIdx: number = Math.max(
        -1,
        ...lessons.map((l, i) => (l.completed ? i : -1))
    );
    const maxUnlockedIndex: number = Math.min(
        lastCompletedIdx >= 0 ? lastCompletedIdx + 1 : 0,
        Math.max(0, total - 1)
    );

    const requestedIndex: number | null = (() => {
        const n = Number(lesson);
        if (!Number.isFinite(n)) return null;
        const idx = Math.max(0, Math.min(total - 1, Math.floor(n) - 1));
        return idx;
    })();

    if (requestedIndex !== null && requestedIndex > maxUnlockedIndex) {
        redirect(`/learn/${course.slug ?? course.id}?lesson=${maxUnlockedIndex + 1}`);
    }

    const initialIndex: number = requestedIndex ?? maxUnlockedIndex;

    const initialLesson = lessons[initialIndex];
    const initialNoteRow = await prisma.lessonNote.findUnique({
        where: {
            userId_courseId_lessonId: {
                userId,
                courseId: course.id,
                lessonId: initialLesson.id,
            },
        },
        select: { content: true },
    });

    return (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h1>
                    <p className="mt-1 text-slate-600">
                        Stay consistent and keep shipping. Your work here counts.
                    </p>
                </div>
                <Link href="/dashboard/courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    My Courses →
                </Link>
            </div>

            <LearnCourseClient
                courseId={course.id}
                courseSlug={course.slug ?? course.id}
                title={course.title}
                lessons={lessons}
                initialIndex={initialIndex}
                initialNote={initialNoteRow?.content ?? ""}
            />
        </main>
    );
}