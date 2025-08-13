//src/app/contact/page.tsx
import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import ContactForm from "@/components/contact/ContactForm";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
    title: "Contact – DirectPlay",
    description: "Questions, feedback, or partnerships? Get in touch.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact – DirectPlay",
        description: "Questions, feedback, or partnerships? Get in touch.",
        url: `${siteUrl}/contact`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Contact – DirectPlay",
        description: "Questions, feedback, or partnerships? Get in touch.",
        images: ["/og.png"],
    },
};

export default function ContactPage() {
    return (
        <main className="relative">
            {/* subtle hero glow */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[220px] bg-[radial-gradient(1100px_300px_at_50%_0%,rgba(99,102,241,.18),rgba(236,72,153,.14),transparent_70%)]" />
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
                <header className="mb-6">
                    <h1 className="text-3xl font-extrabold">Contact us</h1>
                    <p className="mt-1 text-slate-600">
                        Questions, feedback, or partnerships? We’d love to hear from you.
                    </p>
                </header>

                <div className="rounded-3xl bg-white/80 ring-1 ring-black/5 shadow-xl shadow-slate-900/5 p-4 sm:p-6">
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-md p-6 sm:p-8">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </main>
    );
}