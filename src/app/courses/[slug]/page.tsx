//src/app/courses/[slug]/page.tsx
"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getCourseById } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Clock, Play, ShieldCheck } from "lucide-react";
import Breadcrumb, { homeCrumb } from "@/components/Breadcrumb";
import { track } from "@/lib/analytics";

const siteUrl = "https://directplay.in";

export default function CourseDetail() {
    const { slug } = useParams<{ slug: string }>();
    const course = getCourseById(String(slug));

    // 🔎 analytics: page view
    useEffect(() => {
        if (course) {
            track("course_view", { id: course.id, title: course.title });
        }
    }, [course]);

    function handleBuySoon() {
        // 🔎 analytics: buy click
        if (course) track("buy_click", { id: course.id, title: course.title, location: "course_detail" });
        alert("Payments are coming soon. Stay tuned!");
    }

    const courseJsonLd = useMemo(() => {
        if (!course) return null;
        const hours = parseInt(String(course.duration).replace(/\D+/g, ""), 10);
        const timeRequired = Number.isFinite(hours) ? `PT${hours}H` : undefined;

        return {
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: course.description || "Job-focused Java learning path.",
            url: `${siteUrl}/courses/${course.id}`,
            provider: { "@type": "Organization", name: "DirectPlay", url: siteUrl },
            educationalLevel: course.level,
            timeRequired,
            offers: {
                "@type": "Offer",
                priceCurrency: "INR",
                price: String(course.priceINR),
                availability: "https://schema.org/InStock",
                url: `${siteUrl}/courses/${course.id}`,
            },
        };
    }, [course]);

    if (!course) {
        return (
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-2xl font-bold">Course not found</h1>
                <p className="mt-2 text-slate-600">The course you’re looking for doesn’t exist.</p>
                <div className="mt-6">
                    <Button asChild variant="secondary">
                        <Link href="/courses">← Back to all courses</Link>
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            {/* Single, unified breadcrumb */}
            <Breadcrumb className="mb-4" items={[homeCrumb, { label: "Courses", href: "/courses" }, { label: course.title }]} />

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold">{course.title}</h1>
                    <div className="mt-3 flex items-center gap-3 text-sm text-slate-600">
                        <Badge variant="secondary" className="capitalize">{course.level}</Badge>
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> {course.duration}
                        </span>
                        <span className="font-semibold">₹ {course.priceINR}</span>
                    </div>
                    <p className="mt-4 text-slate-700 max-w-2xl">{course.description}</p>

                    <div className="mt-6 flex items-center gap-3">
                        <Button className="gap-2" onClick={handleBuySoon}>
                            Buy Course <ArrowRight className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2 text-slate-600 text-sm">
                            <ShieldCheck className="h-5 w-5 text-emerald-600" /> 7-day refund guarantee
                        </div>
                    </div>
                </div>

                <Card className="w-full lg:w-[520px] overflow-hidden">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <Play className="h-5 w-5 text-indigo-600" /> Preview Lesson
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 px-4 pb-4">
                        <div className="relative h-[320px] bg-slate-900 rounded-xl overflow-hidden">
                            <div className="absolute inset-0 grid place-items-center">
                                <Button size="icon" className="h-16 w-16 rounded-full shadow-lg">
                                    <Play className="h-8 w-8" />
                                </Button>
                            </div>
                            <div className="absolute bottom-3 left-3 text-xs text-slate-300">
                                Chapters • Projects • Notes
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Syllabus */}
            <section className="mt-10 grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Syllabus</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {course.syllabus.map((sec) => (
                            <details key={sec.title} className="rounded-lg border border-slate-200 p-4 open:shadow-sm">
                                <summary className="cursor-pointer font-medium">{sec.title}</summary>
                                <ul className="mt-3 list-disc pl-5 text-sm text-slate-700">
                                    {sec.items.map((it) => (<li key={it}>{it}</li>))}
                                </ul>
                            </details>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>What you’ll get</CardTitle></CardHeader>
                    <CardContent className="text-sm text-slate-700 space-y-2">
                        <div>• Lifetime access & updates</div>
                        <div>• Doubt support & community</div>
                        <div>• Interview prep sheets</div>
                        <div>• Downloadable code & notes</div>
                    </CardContent>
                </Card>
            </section>

            <div className="mt-10">
                <Button asChild variant="secondary">
                    <Link href="/courses">← Back to all courses</Link>
                </Button>
            </div>

            {courseJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }} />
            )}
        </main>
    );
}