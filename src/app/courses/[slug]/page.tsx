// src/app/courses/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, Play, ShieldCheck } from "lucide-react";

/* ---------------- Types ---------------- */

type Params = { slug: string };

type CourseView = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    level: string | null;
    durationHours: number | null;
    priceINR: number | null;
    points: string[] | null;       // 👈 explicitly typed so items are strings
    previewPoster: string | null;
    published: boolean;
    comingSoon: boolean;
};

/* ----------- Dynamic metadata from DB ----------- */
export async function generateMetadata({ params }: { params: Promise<Params> }) {
    const { slug } = await params;
    const c = await prisma.course.findUnique({
        where: { slug },
        select: { title: true, description: true, ogImage: true, published: true, comingSoon: true },
    });

    if (!c || !c.published) return {};

    const title = c.title ?? "Course";
    const desc = c.description ?? "DirectPlay course";
    const image = c.ogImage ?? "/og.png";
    const url = `https://directplay.in/courses/${slug}`;

    return {
        title,
        description: desc,
        alternates: { canonical: `/courses/${slug}` },
        openGraph: { title, description: desc, url, images: [{ url: image }] },
        twitter: { card: "summary_large_image", title, description: desc, images: [image] },
    };
}

/* ---------------- Page ---------------- */
export default async function CourseDetailPage({ params }: { params: Promise<Params> }) {
    const { slug } = await params;

    // Pull the course from DB (typed to CourseView)
    const course = (await prisma.course.findUnique({
        where: { slug },
        select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            level: true,
            durationHours: true,
            priceINR: true,
            points: true,
            previewPoster: true,
            published: true,
            comingSoon: true,
        },
    })) as CourseView | null;

    if (!course || !course.published) {
        notFound();
    }

    // Check if current user is enrolled (for CTA)
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | null)?.id ?? null;

    let isEnrolled = false;
    if (userId) {
        const e = await prisma.enrollment.findFirst({
            where: { userId, courseId: course.id },
            select: { id: true },
        });
        isEnrolled = !!e;
    }

    const duration = `${course.durationHours ?? 0} hrs`;

    // Guard + normalize points for safe rendering
    const points: string[] = Array.isArray(course.points)
        ? (course.points as string[])
        : [];

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <div className="mb-4">
                <Link href="/courses" className="text-sm text-indigo-600 hover:text-indigo-700">
                    ← Back to all courses
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold">{course.title}</h1>
                    <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                        {!!course.level && (
                            <Badge variant="secondary" className="capitalize">
                                {course.level}
                            </Badge>
                        )}
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> {duration}
                        </span>
                        {typeof course.priceINR === "number" && (
                            <span className="font-semibold">₹ {course.priceINR}</span>
                        )}
                    </div>

                    {!!course.description && (
                        <p className="mt-4 text-slate-700 max-w-2xl">{course.description}</p>
                    )}

                    <div className="mt-6 flex items-center gap-3">
                        {course.comingSoon ? (
                            <Button disabled variant="secondary">
                                Coming soon
                            </Button>
                        ) : isEnrolled ? (
                            <Button asChild>
                                <Link href={`/learn/${course.slug}`}>
                                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : (
                            // Placeholder: route to your checkout flow; swap to an enroll API if needed
                            <Button asChild>
                                <Link href={`/checkout/${course.slug}`}>
                                    Buy & Enroll <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}

                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" /> 7-day refund guarantee
                        </div>
                    </div>

                    {!!points.length && (
                        <div className="mt-8">
                            <h2 className="font-semibold mb-2">What you’ll learn</h2>
                            <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                                {points.map((p: string) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <Card className="w-full lg:w-[520px] overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-indigo-600" /> Preview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                        <div className="relative h-[320px] bg-slate-900 rounded-xl overflow-hidden">
                            {course.previewPoster ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={course.previewPoster}
                                    alt={`${course.title} preview`}
                                    className="absolute inset-0 h-full w-full object-cover opacity-80"
                                />
                            ) : null}
                            <div className="absolute inset-0 grid place-items-center">
                                <Button
                                    size="icon"
                                    className="h-16 w-16 rounded-full shadow-lg"
                                    aria-label="Play preview"
                                >
                                    <Play className="h-8 w-8" aria-hidden="true" />
                                </Button>
                            </div>
                            <div className="absolute bottom-3 left-3 text-xs text-slate-300">
                                Chapters • Projects • Notes
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}