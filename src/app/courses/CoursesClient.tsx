// src/app/courses/CoursesClient.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

/* ---------------- types ---------------- */

type CourseRow = {
    id: string;
    slug: string;
    title: string;
    description: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    duration: string | null;
    priceINR: number | null;
    points: string[];
    ogImage?: string | null;
    previewPoster?: string | null;
    comingSoon: boolean;
};

type CoursesPayload = { ok: true; courses: CourseRow[] };

type EnrolledCourse = {
    id: string;
    slug: string;
    done: number;
    total: number;
    pct: number;
};
type EnrollmentsPayload = { ok: true; courses: EnrolledCourse[] } | { ok: false };

/* ---------------- small skeletons ---------------- */

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm">
            <div className="h-5 w-2/3 bg-slate-200 rounded-md animate-pulse" />
            <div className="mt-2 h-4 w-24 bg-slate-100 rounded-md animate-pulse" />
            <div className="mt-5 space-y-2">
                <div className="h-3 w-full bg-slate-100 rounded-md animate-pulse" />
                <div className="h-3 w-11/12 bg-slate-100 rounded-md animate-pulse" />
                <div className="h-3 w-10/12 bg-slate-100 rounded-md animate-pulse" />
            </div>
            <div className="mt-6 h-9 w-28 bg-slate-200 rounded-md animate-pulse" />
        </div>
    );
}

function SectionSkeleton({ count = 3, title }: { count?: number; title?: string }) {
    return (
        <section className="space-y-3">
            {title ? (
                <div className="h-5 w-40 bg-slate-200 rounded-md animate-pulse" />
            ) : null}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        </section>
    );
}

/* ---------------- component ---------------- */

export default function CoursesClient() {
    const params = useSearchParams();
    const q = (params.get("q") || "").toLowerCase().trim();
    const level = (params.get("level") || "").toLowerCase().trim();

    const [courses, setCourses] = React.useState<CourseRow[]>([]);
    const [enrolledMap, setEnrolledMap] = React.useState<Map<string, EnrolledCourse>>(new Map());

    const [coursesLoaded, setCoursesLoaded] = React.useState(false);
    const [enrollLoaded, setEnrollLoaded] = React.useState(false);

    // Fetch both in parallel
    React.useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [cRes, eRes] = await Promise.allSettled([
                    fetch("/api/courses", { cache: "no-store" }),
                    fetch("/api/enrollments", { credentials: "include" }),
                ]);

                if (!cancelled && cRes.status === "fulfilled" && cRes.value.ok) {
                    const data: CoursesPayload = await cRes.value.json();
                    setCourses(data.courses);
                }
            } catch { } finally {
                if (!cancelled) setCoursesLoaded(true);
            }

            try {
                const res = await fetch("/api/enrollments", { credentials: "include" });
                if (!cancelled && res.ok) {
                    const data: EnrollmentsPayload = await res.json();
                    if ("ok" in data && data.ok) {
                        const map = new Map<string, EnrolledCourse>();
                        for (const row of data.courses) map.set(row.id, row);
                        setEnrolledMap(map);
                    }
                }
            } catch { } finally {
                if (!cancelled) setEnrollLoaded(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const loading = !coursesLoaded || !enrollLoaded;

    // While loading, keep the page stable with a skeleton
    if (loading) {
        return (
            <div className="space-y-10">
                <SectionSkeleton title="Your courses" />
                <SectionSkeleton title="Explore more" />
                <SectionSkeleton title="Coming soon" />
            </div>
        );
    }

    // Filter
    const filtered = courses.filter((c) => {
        const matchesQuery =
            !q ||
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.points.some((p) => p.toLowerCase().includes(q));
        const matchesLevel = !level || c.level.toLowerCase() === level;
        return matchesQuery && matchesLevel;
    });

    if (filtered.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 p-6 text-slate-600">
                No courses found{q ? ` for “${q}”` : ""}.
            </div>
        );
    }

    // Buckets
    const enrolled = filtered.filter((c) => enrolledMap.has(c.id));
    const active = filtered.filter((c) => !enrolledMap.has(c.id) && !c.comingSoon);
    const comingSoon = filtered.filter((c) => !enrolledMap.has(c.id) && c.comingSoon);

    return (
        <div className="space-y-10">
            {/* Your courses */}
            {enrolled.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden />
                        <h2 className="font-semibold">Your courses</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolled.map((c) => {
                            const prog = enrolledMap.get(c.id)!;
                            const pct = Math.max(0, Math.min(100, Math.round(prog.pct)));
                            return (
                                <Card
                                    key={c.id}
                                    className="border-slate-200 h-full flex flex-col ring-1 ring-transparent hover:ring-indigo-200 transition"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <CardTitle className="text-lg leading-snug">{c.title}</CardTitle>
                                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                                Enrolled
                                            </Badge>
                                        </div>
                                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                            <Badge variant="secondary" className="capitalize">{c.level}</Badge>
                                            {!!c.duration && <span>{c.duration}</span>}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="text-sm text-slate-700 grow">
                                        <p>{c.description}</p>

                                        <div className="mt-4">
                                            <div className="flex items-center justify-between text-xs text-slate-600">
                                                <span>Progress</span>
                                                <span>{pct}% {prog.total ? `(${prog.done}/${prog.total})` : ""}</span>
                                            </div>
                                            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                                                    style={{ width: `${pct}%` }}
                                                    aria-label={`${c.title} ${pct}% complete`}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <Link
                                                href={`/learn/${prog.slug || c.slug || c.id}`}
                                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800"
                                            >
                                                Continue
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Explore more (active) */}
            {active.length > 0 && (
                <section>
                    {enrolled.length > 0 && <h2 className="font-semibold mb-3">Explore more</h2>}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {active.map((c) => (
                            <Card key={c.id} className="border-slate-200 h-full flex flex-col">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{c.title}</CardTitle>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                        <Badge variant="secondary" className="capitalize">{c.level}</Badge>
                                        {!!c.duration && <span>{c.duration}</span>}
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-700 grow">
                                    <p>{c.description}</p>
                                    <div className="mt-4">
                                        <Link
                                            href={`/courses/${c.slug || c.id}`}
                                            className="inline-flex items-center justify-center rounded-lg bg-white px-3 py-2 text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50"
                                        >
                                            View course
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Coming soon (disabled/grey) */}
            {comingSoon.length > 0 && (
                <section>
                    <h2 className="font-semibold mb-3 text-slate-700">Coming soon</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {comingSoon.map((c) => (
                            <Card key={c.id} className="border-slate-200 h-full flex flex-col opacity-80">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-lg">{c.title}</CardTitle>
                                        <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                                            Coming soon
                                        </Badge>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                        <Badge variant="secondary" className="capitalize">{c.level}</Badge>
                                        {!!c.duration && <span>{c.duration}</span>}
                                    </div>
                                </CardHeader>
                                <CardContent className="text-sm text-slate-600 grow">
                                    <p>{c.description}</p>
                                    <div className="mt-4">
                                        <button
                                            type="button"
                                            disabled
                                            className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-3 py-2 text-slate-500 ring-1 ring-slate-200 cursor-not-allowed"
                                            title="Coming soon"
                                        >
                                            Coming soon
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}