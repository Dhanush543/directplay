// src/app/home-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
    Check,
    Star,
    Play,
    ShieldCheck,
    Users,
    ArrowRight,
    Clock,
    Lock,
    Flame,
    Code,
    Award,
} from "lucide-react";

type CourseRow = {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    level: "Beginner" | "Intermediate" | "Advanced";
    duration: string | null; // computed from durationHours on API
    priceINR: number | null;
    points: string[];
    previewPoster?: string | null;
    comingSoon: boolean;
};
type CoursesPayload = { ok: true; courses: CourseRow[] };

// Lazy-load Framer Motion to reduce unused JS on first paint
const MotionDiv = dynamic(
    () => import("framer-motion").then((m) => m.motion.div),
    { ssr: false, loading: () => <div /> }
);

const sampleCode = `// DirectPlay: Java – Reverse a string with step-by-step notes
public class Main {
  public static String reverse(String input) {
    char[] arr = input.toCharArray();
    int i = 0, j = arr.length - 1;
    while (i < j) {
      char temp = arr[i];
      arr[i] = arr[j];
      arr[j] = temp;
      i++; j--;
    }
    return new String(arr);
  }
  public static void main(String[] args) {
    System.out.println(reverse("DirectPlay")); // yaPltceriD
  }
}`;

const StarRow = ({ count = 5 }: { count?: number }) => (
    <div className="flex gap-1">
        {Array.from({ length: count }).map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
        ))}
    </div>
);

function CodeBlock({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { }
    };
    return (
        <div className="relative">
            <pre className="overflow-auto rounded-xl bg-slate-900 p-4 text-slate-50 shadow-inner ring-1 ring-slate-800 h-[340px] text-sm">
                <code>{code}</code>
            </pre>
            <Button
                size="sm"
                onClick={handleCopy}
                aria-live="polite"
                aria-label={copied ? "Copied to clipboard" : "Copy code to clipboard"}
                className="absolute top-3 right-3 bg-slate-200 text-slate-800 hover:bg-slate-300 shadow-sm ring-1 ring-black/10"
            >
                {copied ? (
                    <span className="inline-flex items-center gap-1.5">
                        <Check className="h-4 w-4" aria-hidden="true" /> Copied
                    </span>
                ) : (
                    "Copy"
                )}
            </Button>
        </div>
    );
}

function CourseCard({ c }: { c: CourseRow }) {
    // If it's coming soon, disable CTA; otherwise link to detail page (/courses/[slug])
    const detailHref = `/courses/${c.slug || c.id}`;
    return (
        <Card className="h-full hover:shadow-lg transition-shadow border-slate-200 flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">{c.title}</CardTitle>
                    {!!c.level && (
                        <Badge variant="secondary" className="capitalize">
                            {c.level}
                        </Badge>
                    )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-slate-600">
                    <Clock className="h-4 w-4" aria-hidden="true" />{" "}
                    <span>{c.duration ?? "Self-paced"}</span>
                </div>
            </CardHeader>
            <CardContent className="grow flex flex-col">
                {!!c.points?.length && (
                    <ul className="space-y-2 text-sm text-slate-600">
                        {c.points.slice(0, 4).map((p) => (
                            <li key={p} className="flex items-start gap-2">
                                <Check className="h-4 w-4 text-emerald-500 mt-0.5" aria-hidden="true" />
                                <span>{p}</span>
                            </li>
                        ))}
                    </ul>
                )}
                <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="text-xl font-bold">{typeof c.priceINR === "number" ? `₹ ${c.priceINR}` : "—"}</div>
                    {c.comingSoon ? (
                        <Button disabled variant="secondary">Coming soon</Button>
                    ) : (
                        <Button asChild className="gap-2">
                            <Link href={detailHref}>
                                View Details <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function HomeClient() {
    const [email, setEmail] = useState("");
    const [courses, setCourses] = useState<CourseRow[]>([]);

    // Load popular/published courses from API (DB)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch("/api/courses", { cache: "no-store" });
                if (!res.ok) return;
                const data: CoursesPayload = await res.json();
                if (!mounted || !data.ok) return;
                setCourses(data.courses);
            } catch { }
        })();
        return () => { mounted = false; };
    }, []);

    // show 3 featured
    const featured = useMemo(() => courses.slice(0, 3), [courses]);

    return (
        <div className="min-h-screen bg-white text-slate-900 pb-28">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-gradient-to-tr from-indigo-500/20 via-violet-500/20 to-fuchsia-500/20 blur-3xl" />
                </div>

                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10 grid grid-cols-1 gap-8 lg:gap-10">
                    {/* text column */}
                    <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                            Master Java.{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                                Crack Your Dream Job.
                            </span>
                        </h1>
                        <p className="mt-4 text-lg text-slate-600 max-w-xl">
                            Job-focused lessons with screen-recorded videos, line-by-line code explanations, quizzes, and interview
                            prep. Learn fast. Learn right.
                        </p>

                        <div className="mt-6 flex items-center gap-3">
                            <Button asChild size="lg" className="gap-2">
                                <Link href="/courses">
                                    Start Learning <ArrowRight className="h-5 w-5" aria-hidden="true" />
                                </Link>
                            </Button>
                            <div className="flex items-center gap-2 text-slate-600">
                                <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                                <span>Secure payments</span>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" aria-hidden="true" /> 5k+ learners
                            </div>
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4" aria-hidden="true" /> Job-ready projects
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock className="h-4 w-4" aria-hidden="true" /> DRM-protected video
                            </div>
                        </div>
                    </MotionDiv>

                    {/* interactive demo */}
                    <MotionDiv
                        id="demo"
                        className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 scroll-mt-24"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        {/* video card */}
                        <Card className="overflow-hidden h-full">
                            <CardHeader className="space-y-1 pb-3">
                                <CardTitle className="flex items-center gap-2">
                                    <Play className="h-5 w-5 text-indigo-600" aria-hidden="true" /> Lesson Preview
                                </CardTitle>
                                <p className="text-sm text-slate-500">Screen-recorded walkthroughs with annotations.</p>
                            </CardHeader>
                            <CardContent className="p-6 pt-0">
                                <div className="relative h-[340px] bg-slate-900 rounded-xl overflow-hidden px-4 sm:px-6">
                                    <div className="absolute inset-0 grid place-items-center">
                                        <Button size="icon" className="h-16 w-16 rounded-full shadow-lg" aria-label="Play preview" title="Play preview">
                                            <Play className="h-8 w-8" aria-hidden="true" />
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-xs text-slate-300">
                                        <Flame className="h-4 w-4 text-orange-400" aria-hidden="true" /> 12 chapters • 3 projects
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* code/notes card */}
                        <Card className="h-full">
                            <Tabs defaultValue="code">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Code className="h-5 w-5 text-violet-600" aria-hidden="true" /> Line-by-Line Notes
                                        </CardTitle>
                                        <div className="hidden sm:block">
                                            <TabsList className="h-9">
                                                <TabsTrigger value="code">Code</TabsTrigger>
                                                <TabsTrigger value="notes">Notes</TabsTrigger>
                                                <TabsTrigger value="faq">FAQ</TabsTrigger>
                                            </TabsList>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-500">Understand what each line does and why.</p>
                                </CardHeader>
                                <CardContent>
                                    <TabsContent value="code" className="mt-0">
                                        <CodeBlock code={sampleCode} />
                                    </TabsContent>
                                    <TabsContent value="notes" className="mt-0 text-sm text-slate-600 space-y-2 h-[340px] overflow-auto">
                                        <p><b>Two-pointer swap:</b> Start at both ends, swap, and move inward—O(n) time, O(1) space.</p>
                                        <p><b>Immutability:</b> Strings are immutable—use a char[] for efficient in-place operations.</p>
                                        <p><b>Interview tip:</b> Be ready to discuss boundary cases like empty strings and surrogate pairs.</p>
                                    </TabsContent>
                                    <TabsContent value="faq" className="mt-0 text-sm text-slate-600 space-y-2 h-[340px] overflow-auto">
                                        <p><b>Will videos be downloadable?</b> No. Streaming-only for enrolled users.</p>
                                        <p><b>Do I get lifetime access?</b> Yes—lifetime access with all updates.</p>
                                    </TabsContent>
                                </CardContent>
                            </Tabs>
                        </Card>
                    </MotionDiv>
                </div>
            </section>

            {/* Popular Courses (from DB) */}
            <section id="courses" className="py-14 bg-slate-50 scroll-mt-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between flex-wrap gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">Popular Courses</h2>
                            <p className="text-slate-600 mt-1">Hand-crafted paths to go from zero → hireable.</p>
                        </div>
                        <div>
                            <Button asChild variant="secondary">
                                <Link href="/courses">Browse All</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                        {featured.map((c) => (
                            <MotionDiv
                                key={c.id}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4 }}
                                className="h-full"
                            >
                                <CourseCard c={c} />
                            </MotionDiv>
                        ))}
                    </div>
                </div>
            </section>

            {/* Outcomes / Trust */}
            <section id="outcomes" className="py-16 scroll-mt-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" /> Industry-ready curriculum
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-slate-600">
                                We focus on exactly what interviews test: DSA, Java internals, and real-world Spring projects.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-violet-600" aria-hidden="true" /> Mentorship & doubt-clearing
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-slate-600">
                                Join weekly mentor hours and a vibrant peer community as you learn.
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-indigo-600" aria-hidden="true" /> Fast, structured learning
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-slate-600">
                                Short lessons, checkpoints, and recap sheets keep you moving without overwhelm.
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-16 bg-slate-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold mb-8">Loved by learners</h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                name: "Meera K.",
                                role: "Java Developer @ FinTech",
                                quote: "The line-by-line explanations finally made threads and streams click. Cracked my interview in 3 weeks!",
                            },
                            {
                                name: "Rohit S.",
                                role: "SDE-1 @ Product Startup",
                                quote: "Loved the interactive notes beside the video. It feels like a mentor is pausing and annotating for me.",
                            },
                            {
                                name: "Ananya P.",
                                role: "CS Grad",
                                quote: "Crystal-clear structure. Projects, quizzes, and resume tips—all in one place. Totally worth it.",
                            },
                        ].map((t) => (
                            <Card key={t.name} className="h-full">
                                <CardHeader>
                                    <CardTitle className="text-base">{t.name}</CardTitle>
                                    <div className="text-xs text-slate-500">{t.role}</div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <StarRow />
                                    <p className="text-slate-700 text-sm leading-relaxed">“{t.quote}”</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-extrabold">Ready to get job-ready?</h2>
                    <p className="mt-2 text-slate-600">
                        Enroll in Java today. Lifetime access, updates included. 7-day refund guarantee.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email"
                            className="w-64"
                        />
                        <Button className="gap-2">
                            Enroll Now <ArrowRight className="h-4 w-4" aria-hidden="true" />
                        </Button>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-2">
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Payments secured by industry-standard gateways.
                    </div>
                </div>
            </section>
        </div>
    );
}