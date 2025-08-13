// src/app/search/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { getCourses } from "@/lib/courses";
import { faqs } from "@/lib/faq";
import { outcomes } from "@/lib/outcomes";

// Make this page dynamic so querystring changes are processed on request
export const dynamic = "force-dynamic";
// (revalidate is ignored for dynamic routes, but leaving it is harmless)
// export const revalidate = 60;

export const metadata: Metadata = {
    title: "Search – DirectPlay",
    description: "Search courses, FAQs, and outcomes on DirectPlay.",
    alternates: { canonical: "/search" },
    robots: {
        index: false, // keep search pages out of the index
        follow: true,
        nocache: true,
        googleBot: { index: false, follow: true },
    },
};

function highlight(text: string, q: string) {
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "ig");
    return text.split(re).map((part, i) =>
        i % 2 === 1 ? (
            <mark key={i} className="bg-yellow-100 px-0.5 rounded">
                {part}
            </mark>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

type SearchParams = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: SearchParams) {
    const { q = "" } = await searchParams; // Next 15: await searchParams
    const query = q.trim();
    const qLower = query.toLowerCase();

    const allCourses = getCourses();

    const courseHits = query
        ? allCourses.filter(
            (c) =>
                c.title.toLowerCase().includes(qLower) ||
                c.description.toLowerCase().includes(qLower) ||
                c.points.some((p) => p.toLowerCase().includes(qLower))
        )
        : [];

    const faqHits = query
        ? faqs.filter(
            (f) =>
                f.q.toLowerCase().includes(qLower) ||
                f.a.toLowerCase().includes(qLower)
        )
        : [];

    const outcomeHits = query
        ? outcomes.filter(
            (o) =>
                o.title.toLowerCase().includes(qLower) ||
                o.body.toLowerCase().includes(qLower)
        )
        : [];

    const hasQuery = query.length > 0;
    const hasResults =
        courseHits.length + faqHits.length + outcomeHits.length > 0;

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-extrabold">Search</h1>
            <p className="mt-2 text-slate-600">
                {hasQuery ? (
                    <>
                        Showing results for <span className="font-medium">“{query}”</span>
                    </>
                ) : (
                    <>Type in the header to search courses, FAQs and outcomes.</>
                )}
            </p>

            {hasQuery && !hasResults && (
                <div className="mt-8 rounded-lg border border-slate-200 p-6 text-slate-600">
                    No results found. Try another keyword.
                </div>
            )}

            {/* Courses */}
            {courseHits.length > 0 && (
                <section className="mt-8">
                    <h2 className="text-xl font-semibold">Courses</h2>
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courseHits.map((c) => (
                            <li
                                key={c.id}
                                className="rounded-xl border border-slate-200 p-5 hover:shadow-sm transition"
                            >
                                <Link
                                    href={`/courses/${c.id}`}
                                    className="text-lg font-semibold hover:underline"
                                >
                                    {highlight(c.title, query)}
                                </Link>
                                <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                                    {highlight(c.description, query)}
                                </p>
                                {c.points.length > 0 && (
                                    <ul className="mt-3 space-y-1 text-sm text-slate-600">
                                        {c.points.slice(0, 3).map((p) => (
                                            <li key={p}>• {highlight(p, query)}</li>
                                        ))}
                                    </ul>
                                )}
                                <Link
                                    href={`/courses/${c.id}`}
                                    className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                                >
                                    View course →
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* FAQ */}
            {faqHits.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-xl font-semibold">FAQ</h2>
                    <div className="mt-4 space-y-4">
                        {faqHits.map((f) => (
                            <div key={f.id} className="rounded-xl border border-slate-200 p-5">
                                <Link href={`/faq#${f.id}`} className="font-medium hover:underline">
                                    {highlight(f.q, query)}
                                </Link>
                                <p className="mt-1 text-sm text-slate-700">
                                    {highlight(f.a, query)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Outcomes */}
            {outcomeHits.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-xl font-semibold">Outcomes</h2>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {outcomeHits.map((o) => (
                            <div key={o.id ?? o.title} className="rounded-xl border border-slate-200 p-5">
                                <div className="font-medium">{highlight(o.title, query)}</div>
                                <p className="mt-1 text-sm text-slate-700">
                                    {highlight(o.body, query)}
                                </p>
                                <Link
                                    href="/#outcomes"
                                    className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                                >
                                    See outcomes
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </main>
    );
}