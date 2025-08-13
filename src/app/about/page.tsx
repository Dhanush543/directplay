// src/app/about/page.tsx
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { aboutContent } from "@/lib/siteContent";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24;

export const metadata: Metadata = {
    title: "About – DirectPlay",
    description: "Our mission, values, and how we build DirectPlay.",
    alternates: { canonical: "/about" },
    openGraph: {
        title: "About – DirectPlay",
        description: "Our mission, values, and how we build DirectPlay.",
        url: `${siteUrl}/about`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "About – DirectPlay",
        description: "Our mission, values, and how we build DirectPlay.",
        images: ["/og.png"],
    },
};

export default function AboutPage() {
    const { hero, highlights, values, timeline, team } = aboutContent;

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="max-w-3xl">
                <h1 className="text-3xl font-extrabold">{hero.title}</h1>
                <p className="mt-2 text-slate-600">{hero.subtitle}</p>
            </header>

            <section className="mt-8 grid sm:grid-cols-3 gap-6">
                {highlights.map((h) => (
                    <Card key={h.title}>
                        <CardHeader>
                            <CardTitle className="text-lg">{h.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-slate-700 text-sm">{h.body}</CardContent>
                    </Card>
                ))}
            </section>

            <section className="mt-10 grid sm:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Our values</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-slate-700 text-sm">
                        {values.map((v) => (
                            <div key={v.title}>
                                <div className="font-medium">{v.title}</div>
                                <p className="mt-1">{v.body}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="text-slate-700 text-sm">
                        <ul className="space-y-2">
                            {timeline.map((t) => (
                                <li key={t.when} className="flex gap-3">
                                    <span className="w-16 shrink-0 font-medium text-slate-900">{t.when}</span>
                                    <span>{t.what}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </section>

            <section className="mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>Team</CardTitle>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {team.map((m) => (
                            <div key={m.name} className="rounded-xl border border-slate-200 p-4">
                                <div className="font-medium">{m.name}</div>
                                <div className="text-sm text-slate-600">{m.role}</div>
                                <p className="mt-2 text-sm text-slate-700">{m.blurb}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>
        </main>
    );
}