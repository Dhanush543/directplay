// src/app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { pricingContent } from "@/lib/siteContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24;

export const metadata: Metadata = {
    title: "Pricing – DirectPlay",
    description: "Simple pricing with lifetime access.",
    alternates: { canonical: "/pricing" },
    openGraph: {
        title: "Pricing – DirectPlay",
        description: "Simple pricing with lifetime access.",
        url: `${siteUrl}/pricing`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Pricing – DirectPlay",
        description: "Simple pricing with lifetime access.",
        images: ["/og.png"],
    },
};

function formatINR(n: number) {
    try {
        return new Intl.NumberFormat("en-IN").format(n);
    } catch {
        return String(n);
    }
}

export default function PricingPage() {
    const { hero, currency, tiers, faqs } = pricingContent;

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            {/* Header */}
            <header className="max-w-3xl">
                <h1 className="text-3xl font-extrabold">{hero.title}</h1>
                <p className="mt-2 text-slate-600">{hero.subtitle}</p>
            </header>

            {/* Pricing Cards */}
            <section className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tiers.map((t) => (
                    <Card
                        key={t.id}
                        className={[
                            "flex flex-col h-full border-slate-200",
                            t.badge ? "ring-1 ring-indigo-500/20 shadow-lg" : "",
                        ].join(" ")}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{t.name}</CardTitle>
                                {t.badge ? (
                                    <Badge className="bg-indigo-600 hover:bg-indigo-600 text-white">{t.badge}</Badge>
                                ) : null}
                            </div>
                            <div className="mt-2">
                                <div className="text-3xl font-extrabold">
                                    ₹ {formatINR(t.price)}{" "}
                                    <span className="align-middle text-sm font-medium text-slate-500">{t.period}</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="grow">
                            <ul className="mt-2 space-y-2 text-sm text-slate-700">
                                {t.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <Check className="h-4 w-4 text-emerald-500 mt-0.5" />
                                        <span>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-5">
                                <Button asChild className="w-full">
                                    <Link href={t.cta.href}>{t.cta.label}</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </section>

            {/* Comparison Table */}
            <section className="mt-14">
                <h2 className="text-xl font-semibold text-slate-900">Compare plans</h2>
                <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-slate-700">Feature</th>
                                {tiers.map((t) => (
                                    <th key={t.id} className="py-3 px-4 text-center font-medium text-slate-700">
                                        {t.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {Array.from(
                                new Set(tiers.flatMap((t) => t.features))
                            ).map((feature) => (
                                <tr key={feature}>
                                    <td className="py-3 px-4 text-slate-700">{feature}</td>
                                    {tiers.map((t) => (
                                        <td key={t.id} className="py-3 px-4 text-center">
                                            {t.features.includes(feature) ? (
                                                <Check className="h-4 w-4 text-emerald-500 mx-auto" />
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQs */}
            {faqs?.length ? (
                <section className="mt-14">
                    <h2 className="text-xl font-semibold">FAQs</h2>
                    <div className="mt-4 grid sm:grid-cols-2 gap-6">
                        {faqs.map((f, i) => (
                            <div key={f.q + i} className="rounded-xl border border-slate-200 p-5">
                                <div className="font-medium">{f.q}</div>
                                <p className="mt-1 text-sm text-slate-700">{f.a}</p>
                            </div>
                        ))}
                    </div>
                </section>
            ) : null}

            {/* CTA Band */}
            <section className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-8 text-center text-white">
                <h2 className="text-2xl font-bold">Ready to start learning?</h2>
                <p className="mt-2 text-indigo-100">
                    Join thousands of learners mastering Java and landing better jobs.
                </p>
                <div className="mt-5 flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" variant="secondary">
                        <Link href="/auth?view=signup">Start with Pro</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20">
                        <Link href="/auth?view=signup">See all plans</Link>
                    </Button>
                </div>
            </section>
        </main>
    );
}