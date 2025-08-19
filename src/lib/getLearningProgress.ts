// src/lib/getLearningProgress.ts
import prisma from "@/lib/prisma";

export type CourseProgressRow = {
    courseId: string;
    title: string;
    done: number;
    total: number;
    pct: number;
};

export async function getLearningProgress(userId: string): Promise<CourseProgressRow[]> {
    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true } } },
    });

    const rows: CourseProgressRow[] = [];
    for (const e of enrollments) {
        const total = await prisma.lesson.count({ where: { courseId: e.course.id } });
        const done = await prisma.lessonProgress.count({
            where: { userId, courseId: e.course.id, completed: true },
        });
        rows.push({
            courseId: e.course.id,
            title: e.course.title,
            done,
            total,
            pct: total ? Math.round((done / total) * 100) : 0,
        });
    }
    return rows;
}