// src/app/learn/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export const metadata = {
    title: "Learn – DirectPlay",
};

export default async function LearnLanding() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    const userId = (session.user as unknown as { id: string }).id;

    const firstEnrollment = await prisma.enrollment.findFirst({
        where: { userId },
        include: { course: { select: { slug: true, id: true } } },
        orderBy: { startedAt: "asc" },
    });

    if (firstEnrollment?.course?.slug) {
        redirect(`/learn/${firstEnrollment.course.slug}`);
    }

    // No enrollments yet → go browse courses
    redirect("/courses?from=learn");
}