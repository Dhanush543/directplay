// src/app/certificates/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Certificates • DirectPlay" };

export default async function CertificatesPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-4xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
                    <p className="mt-1 text-slate-600">
                        Earn shareable certificates for completed tracks and projects.
                    </p>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
                    ← Back to dashboard
                </Link>
            </div>

            <section className="mt-6 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Placeholder certificate card */}
                    <div className="rounded-xl border border-dashed border-slate-300 p-5">
                        <div className="h-32 rounded-lg bg-gradient-to-br from-indigo-50 to-fuchsia-50 ring-1 ring-slate-200 grid place-items-center">
                            <span className="text-sm text-slate-600">Preview</span>
                        </div>
                        <h3 className="mt-4 font-semibold">DirectPlay Certificate</h3>
                        <p className="mt-1 text-sm text-slate-600">
                            Certificates unlock after you complete a track with required projects and quizzes.
                        </p>
                        <div className="mt-3">
                            <button
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-white opacity-50 cursor-not-allowed"
                                aria-disabled
                            >
                                Generate sample
                            </button>
                        </div>
                    </div>

                    {/* Roadmap */}
                    <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-5">
                        <h3 className="font-semibold">What’s coming</h3>
                        <ul className="mt-3 list-disc pl-5 text-sm text-slate-700 space-y-1">
                            <li>Automatic certificate issue on completion</li>
                            <li>Verification link with unique certificate ID</li>
                            <li>One-click share to LinkedIn</li>
                            <li>PDF downloads and re-issue</li>
                        </ul>
                    </div>
                </div>
            </section>
        </main>
    );
}