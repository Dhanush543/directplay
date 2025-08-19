// src/app/privacy/page.tsx
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { legalContent } from "@/lib/siteContent";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
    title: "Privacy Policy – DirectPlay",
    description: "How DirectPlay collects and uses data.",
    alternates: { canonical: "/privacy" },
    openGraph: {
        title: "Privacy Policy – DirectPlay",
        description: "How DirectPlay collects and uses data.",
        url: `${siteUrl}/privacy`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "article",
    },
    twitter: {
        card: "summary_large_image",
        title: "Privacy Policy – DirectPlay",
        description: "How DirectPlay collects and uses data.",
        images: ["/og.png"],
    },
};

export default function PrivacyPage() {
    const data = legalContent.privacy;

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Privacy Policy – DirectPlay",
        url: `${siteUrl}/privacy`,
        dateModified: data.updatedOn,
        description: "How DirectPlay collects and uses data.",
    };

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
                <p className="mt-2 text-slate-600">Last updated: {data.updatedOn}</p>
            </header>

            <div className="mx-auto max-w-5xl">
                <article className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:p-10 shadow-sm">
                    <h2 className="text-base font-semibold">Your privacy matters</h2>

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