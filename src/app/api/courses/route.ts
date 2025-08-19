//src/app/api/courses/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type CourseRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    level: string | null;
    durationHours: number | null;
    priceINR: number | null;
    points: unknown | null;
    ogImage: string | null;
    previewPoster: string | null;
    comingSoon: boolean;
};

export async function GET() {
    const rows: CourseRow[] = await prisma.course.findMany({
        where: { published: true },
        orderBy: [{ comingSoon: "asc" }, { title: "asc" }],
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            durationHours: true,
            priceINR: true,
            points: true,
            ogImage: true,
            previewPoster: true,
            comingSoon: true,
        },
    });

    return NextResponse.json({
        ok: true as const,
        courses: rows.map((r) => ({
            ...r,
            points: Array.isArray(r.points) ? (r.points as string[]) : [],
            duration: r.durationHours ? `${r.durationHours} hrs` : null,
        })),
    });
}