"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourses } from "@/lib/courses";

/**
 * Client-side shell so we can safely use useSearchParams()
 * (e.g., for simple filtering like ?q= or ?level=).
 */
export default function CoursesClient() {
    const params = useSearchParams();
    const q = (params.get("q") || "").toLowerCase().trim();
    const level = (params.get("level") || "").toLowerCase().trim();

    const all = getCourses();
    const filtered = all.filter((c) => {
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

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((c) => (
                <Card key={c.id} className="border-slate-200 h-full flex flex-col">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{c.title}</CardTitle>
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                            <Badge variant="secondary" className="capitalize">{c.level}</Badge>
                            <span>{c.duration}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-700 grow">
                        <p>{c.description}</p>
                        <div className="mt-4">
                            <Link
                                href={`/courses/${c.id}`}
                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                View course
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}