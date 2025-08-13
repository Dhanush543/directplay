//src/app/faq/page.tsx
import type { Metadata } from "next";
import Breadcrumb, { homeCrumb } from "@/components/Breadcrumb";
import { faqs } from "@/lib/faq";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
    title: "FAQ – DirectPlay",
    description:
        "Quick answers to the most common questions about DirectPlay courses, access, refunds, and support.",
    alternates: { canonical: "/faq" },
    openGraph: {
        title: "FAQ – DirectPlay",
        description:
            "Quick answers to the most common questions about DirectPlay courses, access, refunds, and support.",
        url: `${siteUrl}/faq`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay FAQ" }],
        type: "article",
    },
    twitter: {
        card: "summary",
        title: "FAQ – DirectPlay",
        description:
            "Quick answers to the most common questions about DirectPlay courses, access, refunds, and support.",
        images: ["/og.png"],
    },
};

export default function FAQPage() {
    // JSON-LD for rich results
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <Breadcrumb items={[homeCrumb, { label: "FAQ", href: "/faq" }]} />

            <header className="mt-2 mb-6">
                <h1 className="text-3xl font-extrabold">Frequently Asked Questions</h1>
                <p className="mt-2 text-slate-600">
                    Quick answers to the most common questions about DirectPlay.
                </p>
            </header>

            <div className="space-y-4">
                {faqs.map((f) => (
                    <section
                        key={f.id}
                        id={f.id}
                        className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                        <h2 className="text-lg font-semibold mb-2">{f.q}</h2>
                        <p className="text-slate-700">{f.a}</p>
                    </section>
                ))}
            </div>

            {/* SEO: FAQPage JSON-LD */}
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
        </main>
    );
}