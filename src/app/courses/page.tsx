// src/app/courses/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { siteUrl } from "@/lib/site";
import CoursesClient from "./CoursesClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
    title: "Courses – DirectPlay",
    description: "Browse all DirectPlay Java courses.",
    alternates: { canonical: "/courses" },
    openGraph: {
        title: "Courses – DirectPlay",
        description: "Browse all DirectPlay Java courses.",
        url: `${siteUrl}/courses`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay Courses" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Courses – DirectPlay",
        description: "Browse all DirectPlay Java courses.",
        images: ["/og.png"],
    },
};

export default async function CoursesPage() {
    const session = await getServerSession(authOptions);
    const homeHref = session?.user ? "/dashboard" : "/";

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-6">
                <h1 className="text-3xl font-extrabold">Courses</h1>
                <p className="mt-2 text-slate-600">
                    Explore our job-focused Java paths with interactive notes and projects.
                </p>
            </header>

            <Suspense
                fallback={
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="h-40 rounded-xl border border-slate-200 animate-pulse bg-slate-50"
                            />
                        ))}
                    </div>
                }
            >
                <CoursesClient />
            </Suspense>

            <div className="mt-10">
                <Link
                    href={homeHref}
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-slate-900 ring-1 ring-slate-200 hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                >
                    ← Back home
                </Link>
            </div>
        </main>
    );
}