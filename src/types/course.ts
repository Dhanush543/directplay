// src/types/course.ts

/** Raw shape returned from Prisma select in /api/courses */
export type CourseRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    level: "Beginner" | "Intermediate" | "Advanced" | string; // keep string fallback if DB isn't enum
    durationHours: number | null;
    priceINR: number | null;
    points: string[] | null;
    ogImage: string | null;
    previewPoster: string | null;
    comingSoon: boolean;
    // If you selected `published` in some queries, keep it optional here:
    published?: boolean;
};

/** Client-friendly shape for cards/lists */
export type CourseCardData = CourseRow & {
    /** Human-readable duration like "24 hrs" (or null if unknown) */
    duration: string | null;
};

/** Map a DB row to a client-friendly card shape */
export function toCourseCardData(r: CourseRow): CourseCardData {
    return {
        ...r,
        duration: r.durationHours != null ? `${r.durationHours} hrs` : null,
    };
}