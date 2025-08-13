"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight, Check } from "lucide-react";
import { getCourses } from "@/lib/courses";
import Breadcrumb, { homeCrumb } from "@/components/Breadcrumb";
import { track } from "@/lib/analytics";

const siteUrl = "https://directplay.in";

function escapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function Highlight({ text, query }: { text: string; query: string }) {
    if (!query) return <>{text}</>;
    const q = query.trim();
    if (!q) return <>{text}</>;
    const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, "ig"));
    const qLower = q.toLowerCase();
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === qLower ? (
                    <mark key={i} className="bg-yellow-200/60 rounded px-0.5 ring-1 ring-yellow-300/30">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

export default function CoursesPage() {
    const all = getCourses();
    const searchParams = useSearchParams();
    const router = useRouter();
    const qParam = (searchParams.get("q") || "").trim();

    const filtered = useMemo(() => {
        const q = qParam.toLowerCase();
        if (!q) return all;
        return all.filter((c) => {
            const hay = [c.title, c.level, c.duration, c.description, ...(c.points || [])]
                .join(" ")
                .toLowerCase();
            return hay.includes(q);
        });
    }, [all, qParam]);

    const listJsonLd = useMemo(() => {
        return {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: filtered.map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${siteUrl}/courses/${c.id}`,
                name: c.title,
            })),
        };
    }, [filtered]);

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <Breadcrumb items={[homeCrumb, { label: "Courses", href: "/courses" }]} />

            <div className="flex items-end justify-between flex-wrap gap-4 mt-2">
                <div>
                    <h1 className="text-3xl font-extrabold">Courses</h1>
                    <p className="text-slate-600 mt-1">Pick a path. Learn right. Get hired.</p>
                </div>

                {qParam ? (
                    <div className="flex items-center gap-3 text-sm">
                        <span className="text-slate-600">
                            Showing <span className="font-medium">{filtered.length}</span> result
                            {filtered.length === 1 ? "" : "s"} for <span className="font-medium">“{qParam}”</span>
                        </span>
                        <Button variant="secondary" onClick={() => router.replace("/courses")} title="Clear search">
                            Clear
                        </Button>
                    </div>
                ) : null}
            </div>

            {filtered.length === 0 ? (
                <div className="mt-12 text-slate-600">
                    No results for <span className="font-medium">“{qParam}”</span>. Try a different keyword (e.g., <em>streams</em>, <em>Spring</em>, <em>OOP</em>).
                </div>
            ) : (
                <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                    {filtered.map((c) => (
                        <Card key={c.id} className="h-full border-slate-200 flex flex-col">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold">
                                        <Highlight text={c.title} query={qParam} />
                                    </CardTitle>
                                    <Badge variant="secondary" className="capitalize">
                                        {c.level}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-slate-600">
                                    <Clock className="h-4 w-4" /> <span>{c.duration}</span>
                                </div>
                            </CardHeader>

                            <CardContent className="grow flex flex-col">
                                <ul className="space-y-2 text-sm text-slate-600">
                                    {c.points.map((p) => (
                                        <li key={p} className="flex items-start gap-2">
                                            <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                                            <span>
                                                <Highlight text={p} query={qParam} />
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-auto flex items-center justify-between pt-4">
                                    <div className="text-xl font-bold">₹ {c.priceINR}</div>
                                    <Button
                                        asChild
                                        className="gap-2"
                                        onClick={() => track("view_details_click", { id: c.id, title: c.title, location: "courses_list" })}
                                    >
                                        <Link href={`/courses/${c.id}`}>
                                            View Details <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listJsonLd) }} />
        </main>
    );
}