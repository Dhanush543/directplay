// src/app/api/enrollments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

type CoursePick = {
    id: string;
    slug: string | null;
    title: string;
    totalLessons: number | null;
};

type EnrollmentRow = {
    course: CoursePick;
};

type GroupCount = {
    courseId: string;
    _count: { _all: number };
};

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | null)?.id;
    if (!userId) {
        // Not signed in → just return ok:false so client shows catalog only
        return NextResponse.json({ ok: false }, { status: 200 });
    }

    // User enrollments
    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
            course: { select: { id: true, slug: true, title: true, totalLessons: true } },
        },
        orderBy: { startedAt: "asc" },
    });

    const courseIds: string[] = enrollments.map(
        (e: EnrollmentRow) => e.course.id
    );
    if (courseIds.length === 0) {
        return NextResponse.json({ ok: true, courses: [] });
    }

    // Completed per course
    const completed = await prisma.lessonProgress.groupBy({
        by: ["courseId"],
        where: { userId, completed: true, courseId: { in: courseIds } },
        _count: { _all: true },
    });
    const doneMap = new Map<string, number>();
    for (const g of completed as GroupCount[]) {
        doneMap.set(g.courseId, g._count._all);
    }

    // Total lessons per course – prefer Lesson rows; fallback to Course.totalLessons
    const totals = await prisma.lesson.groupBy({
        by: ["courseId"],
        where: { courseId: { in: courseIds } },
        _count: { _all: true },
    });
    const totalMap = new Map<string, number>();
    for (const t of totals as GroupCount[]) {
        totalMap.set(t.courseId, t._count._all);
    }

    const courses = enrollments.map((e: EnrollmentRow) => {
        const id = e.course.id;
        const totalFromLessons = totalMap.get(id) ?? 0;
        const fallback = e.course.totalLessons ?? 0;
        const total = totalFromLessons || fallback || 0;
        const done = doneMap.get(id) ?? 0;
        const pct =
            total > 0 ? Math.max(0, Math.min(100, Math.round((done / total) * 100))) : 0;

        return { id, slug: e.course.slug, done, total, pct };
    });

    return NextResponse.json({ ok: true, courses });
}