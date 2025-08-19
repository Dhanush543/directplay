// prisma/seed.mjs
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const EMAIL = process.env.SEED_USER_EMAIL || 'dhanushpettugani@gmail.com';

function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}

async function getOrCreateUserByEmail(email) {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) return existing;
    return prisma.user.create({
        data: { email, name: email.split('@')[0] },
    });
}

/** Upsert a course (with marketing fields) and N lessons (1-based index). */
async function upsertCourseWithLessons({
    slug,
    title,
    totalLessons,
    description,
    level,
    durationHours,
    priceINR,
    points,
    ogImage,
    previewPoster,
    published = true,
    comingSoon = false,
}) {
    const course = await prisma.course.upsert({
        where: { slug },
        update: {
            title,
            description,
            level,
            durationHours,
            priceINR,
            points,
            ogImage,
            previewPoster,
            published,
            comingSoon,
            totalLessons, // keep legacy field roughly in sync
        },
        create: {
            slug,
            title,
            description,
            level,
            durationHours,
            priceINR,
            points,
            ogImage,
            previewPoster,
            published,
            comingSoon,
            totalLessons,
        },
    });

    // Upsert each lesson so we get IDs back (createMany wouldn’t return IDs)
    const lessonsByIndex = new Map();
    for (let i = 1; i <= totalLessons; i++) {
        const lesson = await prisma.lesson.upsert({
            where: { courseId_index: { courseId: course.id, index: i } },
            update: { title: `Lesson ${i}` },
            create: {
                courseId: course.id,
                index: i,
                title: `Lesson ${i}`,
                // videoUrl: `https://cdn.example.com/${slug}/${i}.mp4`,
            },
            select: { id: true, index: true },
        });
        lessonsByIndex.set(i, lesson.id);
    }

    return { course, lessonsByIndex };
}

async function enrollUserInCourse(userId, courseId) {
    await prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        update: {},
        create: { userId, courseId },
    });
}

/** Mark first K lessons as completed, with simple durations */
async function seedProgress({ userId, courseId, lessonsByIndex, completeCount }) {
    const rows = [];
    for (let i = 1; i <= completeCount; i++) {
        const lessonId = lessonsByIndex.get(i);
        if (!lessonId) continue;
        const durationSeconds = 600 + i * 30; // ~10–20 min
        rows.push({ userId, courseId, lessonId, completed: true, durationSeconds });
    }
    if (rows.length) {
        await prisma.lessonProgress.createMany({ data: rows, skipDuplicates: true });
    }
}

async function seedStreak(userId) {
    const today = startOfDay(new Date());
    const yday = startOfDay(new Date(Date.now() - 24 * 60 * 60 * 1000));
    await prisma.streakLog.createMany({
        data: [
            { userId, day: yday },
            { userId, day: today },
        ],
        skipDuplicates: true,
    });
}

async function seedNotifications(userId) {
    await prisma.notification.createMany({
        data: [
            { userId, type: 'email', title: 'Welcome to DirectPlay', meta: 'Email · just now', read: false },
            { userId, type: 'auth', title: 'Signed in securely', meta: 'Auth · 2m ago', read: false },
        ],
        skipDuplicates: true,
    });
}

async function printSummary(userId) {
    const lessonsCompleted = await prisma.lessonProgress.count({
        where: { userId, completed: true },
    });

    const agg = await prisma.lessonProgress.aggregate({
        where: { userId, completed: true },
        _sum: { durationSeconds: true },
    });
    const studySeconds = agg._sum.durationSeconds ?? 0;

    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: { course: { select: { id: true, title: true } } },
    });

    const courseIds = enrollments.map((e) => e.course.id);
    const grouped = await prisma.lessonProgress.groupBy({
        by: ['courseId'],
        where: { userId, completed: true, courseId: { in: courseIds } },
        _count: { _all: true },
    });
    const doneMap = new Map(grouped.map((g) => [g.courseId, g._count._all]));

    for (const e of enrollments) {
        const total = await prisma.lesson.count({ where: { courseId: e.course.id } });
        const done = doneMap.get(e.course.id) ?? 0;
        const pct = total ? Math.round((done / total) * 100) : 0;
        console.log(`Course: ${e.course.title} — ${done}/${total} (${pct}%)`);
    }

    const mins = Math.floor(studySeconds / 60);
    console.log('---------------------------------------------------');
    console.log(`Lessons completed: ${lessonsCompleted}`);
    console.log(`Study time:        ${mins}m (${studySeconds}s)`);
    console.log('Seed complete ✅');
}

async function main() {
    const user = await getOrCreateUserByEmail(EMAIL);
    console.log(`Seeding for: ${user.email} (id: ${user.id})`);

    // Courses + Lessons with full marketing fields
    const js = await upsertCourseWithLessons({
        slug: 'js-foundations',
        title: 'JavaScript Foundations',
        totalLessons: 20,
        description: 'Start from zero and build solid JavaScript foundations with hands-on exercises and projects.',
        level: 'Beginner',
        durationHours: 24,
        priceINR: 699,
        points: ['Syntax & Types', 'Functions & Scope', 'Async & Promises', 'Arrays & Objects'],
        ogImage: '/og/js-foundations.png',
        previewPoster: '/posters/js-foundations.png',
        published: true,
        comingSoon: false,
    });

    const react = await upsertCourseWithLessons({
        slug: 'react-essentials',
        title: 'React Essentials',
        totalLessons: 18,
        description: 'Master React fundamentals and patterns to build real-world UIs confidently.',
        level: 'Intermediate',
        durationHours: 18,
        priceINR: 999,
        points: ['Components & Props', 'Hooks', 'State & Effects', 'Routing'],
        ogImage: '/og/react-essentials.png',
        previewPoster: '/posters/react-essentials.png',
        published: true,
        comingSoon: false,
    });

    // Example “coming soon” course (published in catalog, but greyed out)
    await upsertCourseWithLessons({
        slug: 'java-fundamentals',
        title: 'Java Fundamentals',
        totalLessons: 0, // add lessons later
        description: 'Solid Java foundations with OOP, Collections, Generics, and more.',
        level: 'Beginner',
        durationHours: 28,
        priceINR: 899,
        points: ['OOP', 'Collections', 'Exceptions'],
        ogImage: '/og/java-fundamentals.png',
        previewPoster: '/posters/java-fundamentals.png',
        published: true,
        comingSoon: true, // will appear grey/inactive in UI
    });

    // Enrollments
    await enrollUserInCourse(user.id, js.course.id);
    await enrollUserInCourse(user.id, react.course.id);

    // Progress: first 2 JS lessons complete, first React lesson complete
    await seedProgress({
        userId: user.id,
        courseId: js.course.id,
        lessonsByIndex: js.lessonsByIndex,
        completeCount: 2,
    });
    await seedProgress({
        userId: user.id,
        courseId: react.course.id,
        lessonsByIndex: react.lessonsByIndex,
        completeCount: 1,
    });

    await seedStreak(user.id);
    await seedNotifications(user.id);

    await printSummary(user.id);
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });