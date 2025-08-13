// src/app/terms/page.tsx
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { legalContent } from "@/lib/siteContent";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 24;

export const metadata: Metadata = {
    title: "Terms of Service – DirectPlay",
    description: "DirectPlay Terms of Service.",
    alternates: { canonical: "/terms" },
    openGraph: {
        title: "Terms of Service – DirectPlay",
        description: "DirectPlay Terms of Service.",
        url: `${siteUrl}/terms`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "article",
    },
    twitter: {
        card: "summary_large_image",
        title: "Terms of Service – DirectPlay",
        description: "DirectPlay Terms of Service.",
        images: ["/og.png"],
    },
};

export default function TermsPage() {
    const data = legalContent.terms;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Terms of Service – DirectPlay",
        url: `${siteUrl}/terms`,
        dateModified: data.updatedOn,
        description: "DirectPlay Terms of Service.",
    };

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold">Terms of Service</h1>
                <p className="mt-2 text-slate-600">Last updated: {data.updatedOn}</p>
            </header>

            <div className="mx-auto max-w-5xl">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm">
                    <h2 className="text-base font-semibold">DirectPlay Terms</h2>

                    <section className="mt-6 space-y-6 text-slate-800 leading-relaxed">
                        {data.sections.map((sec) => (
                            <div key={sec.heading}>
                                <h3 className="font-semibold">{sec.heading}</h3>
                                {"body" in sec && sec.body?.map((p) => (
                                    <p key={p} className="mt-2 text-slate-700">{p}</p>
                                ))}
                                {"list" in sec && sec.list?.length ? (
                                    <ul className="mt-2 list-disc pl-5 text-slate-700">
                                        {sec.list.map((item) => <li key={item}>{item}</li>)}
                                    </ul>
                                ) : null}
                            </div>
                        ))}
                    </section>
                </article>
            </div>

            {/* JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        </main>
    );
}