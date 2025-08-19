import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // 1) Create / upsert course
    const course = await prisma.course.upsert({
        where: { slug: 'spring-boot-pro' },
        update: {
            title: 'Spring Boot Pro',
            description: 'Build production-grade Spring Boot services with security and deployments.',
            level: 'Intermediate',
            durationHours: 20,
            priceINR: 1299,
            points: ['REST APIs', 'Spring Security', 'Testing', 'Docker & Deploy'],
            published: true,
            comingSoon: false,
            totalLessons: 12,
        },
        create: {
            slug: 'spring-boot-pro',
            title: 'Spring Boot Pro',
            description: 'Build production-grade Spring Boot services with security and deployments.',
            level: 'Intermediate',
            durationHours: 20,
            priceINR: 1299,
            points: ['REST APIs', 'Spring Security', 'Testing', 'Docker & Deploy'],
            published: true,
            comingSoon: false,
            totalLessons: 12,
        },
        select: { id: true, title: true },
    });

    // 2) Upsert 12 lessons (1-based indexes)
    for (let i = 1; i <= 12; i++) {
        await prisma.lesson.upsert({
            where: { courseId_index: { courseId: course.id, index: i } },
            update: { title: `Lesson ${i}` },
            create: {
                courseId: course.id,
                index: i,
                title: `Lesson ${i}`,
                // videoUrl: 'https://cdn.example.com/spring-boot-pro/' + i + '.mp4'
            },
        });
    }

    console.log('Course created:', course.title);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });