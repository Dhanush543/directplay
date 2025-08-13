// src/app/careers/page.tsx
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, MapPin, Clock } from "lucide-react";
import { careersContent } from "@/lib/siteContent";
import { siteUrl } from "@/lib/site";
import CareerApplyLink from "@/components/CareerApplyLink";
import NotifyMeForm from "@/components/NotifyMeForm";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
    title: "Careers – DirectPlay",
    description: "Join us to build the most effective way to learn Java.",
    alternates: { canonical: "/careers" },
    openGraph: {
        title: "Careers – DirectPlay",
        description: "Join us to build the most effective way to learn Java.",
        url: `${siteUrl}/careers`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Careers – DirectPlay",
        description: "Join us to build the most effective way to learn Java.",
        images: ["/og.png"],
    },
};

// Local type guards so we don't have to change lib/siteContent
type ApplyEmail = { type: "email"; to: string; subject?: string };
type ApplyUrl = { type: "url"; url: string };

function isApplyEmail(a: unknown): a is ApplyEmail {
    return (
        typeof a === "object" &&
        a !== null &&
        // discriminant
        "type" in a &&
        (a as { type?: unknown }).type === "email" &&
        // shape
        "to" in a &&
        typeof (a as { to?: unknown }).to === "string"
    );
}

function isApplyUrl(a: unknown): a is ApplyUrl {
    return (
        typeof a === "object" &&
        a !== null &&
        "type" in a &&
        (a as { type?: unknown }).type === "url" &&
        "url" in a &&
        typeof (a as { url?: unknown }).url === "string"
    );
}
function employmentTypeFrom(rType: string) {
    const t = rType.toLowerCase();
    if (t.includes("full")) return "FULL_TIME";
    if (t.includes("part")) return "PART_TIME";
    if (t.includes("contract")) return "CONTRACTOR";
    if (t.includes("intern")) return "INTERN";
    return "OTHER";
}

export default function CareersPage() {
    const { intro, roles, hiringOpen, notifyFormAction } = careersContent;

    // Closed state (or simply no roles)
    if (!hiringOpen || roles.length === 0) {
        return (
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-3xl font-extrabold">Careers</h1>
                <p className="mt-2 text-slate-600 max-w-2xl">
                    We’re not hiring right now — but we’ll announce new roles soon. Leave your email and we’ll notify you as soon as we post openings.
                </p>

                <div className="mt-8 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
                    <h2 className="text-lg font-semibold">Get notified when we’re hiring</h2>
                    <NotifyMeForm formAction={notifyFormAction} />
                    <p className="mt-3 text-sm text-slate-600">
                        We’ll only email about new roles. No spam.
                    </p>
                </div>
            </main>
        );
    }

    // OPEN roles view
    const jobsLd = roles.map((r) => ({
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: r.title,
        description: r.summary,
        hiringOrganization: { "@type": "Organization", name: "DirectPlay", sameAs: siteUrl },
        employmentType: employmentTypeFrom(r.type),
        jobLocationType: "TELECOMMUTE",
        jobLocation: [{ "@type": "Place", address: { "@type": "PostalAddress", addressCountry: "IN", addressLocality: r.location } }],
        applicantLocationRequirements: { "@type": "Country", name: "India" },
        url: isApplyUrl(r.apply) ? r.apply.url : `${siteUrl}/careers#${r.id}`,
    }));

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-3xl font-extrabold">Careers</h1>
            <p className="mt-2 text-slate-600 max-w-2xl">{intro}</p>

            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
                {roles.map((r) => (
                    <Card key={r.id} className="border-slate-200 h-full flex flex-col" id={r.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-indigo-600" />
                                {r.title}
                            </CardTitle>
                            <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                                <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-4 w-4" /> {r.location}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> {r.type}
                                </span>
                            </div>
                        </CardHeader>

                        <CardContent className="text-sm text-slate-700 space-y-4 grow">
                            <p>{r.summary}</p>

                            {r.responsibilities?.length ? (
                                <div>
                                    <div className="font-medium">Responsibilities</div>
                                    <ul className="mt-2 list-disc pl-5 space-y-1">
                                        {r.responsibilities.map((it) => (<li key={it}>{it}</li>))}
                                    </ul>
                                </div>
                            ) : null}

                            {r.requirements?.length ? (
                                <div>
                                    <div className="font-medium">Requirements</div>
                                    <ul className="mt-2 list-disc pl-5 space-y-1">
                                        {r.requirements.map((it) => (<li key={it}>{it}</li>))}
                                    </ul>
                                </div>
                            ) : null}

                            <div className="pt-2">
                                {"apply" in r && isApplyEmail(r.apply) ? (
                                    <CareerApplyLink
                                        href={`mailto:${r.apply.to}?subject=${encodeURIComponent(r.apply.subject || "Job Application")}`}
                                        label="Apply via Email"
                                        method="email"
                                        roleId={r.id}
                                        roleTitle={r.title}
                                    />
                                ) : isApplyUrl(r.apply) ? (
                                    <CareerApplyLink
                                        href={r.apply.url}
                                        label="Apply"
                                        method="url"
                                        roleId={r.id}
                                        roleTitle={r.title}
                                        newTab
                                    />
                                ) : null}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobsLd) }} />
        </main>
    );
}