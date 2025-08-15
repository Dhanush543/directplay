// src/app/billing/page.tsx
import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata: Metadata = { title: "Billing • DirectPlay" };


export default async function BillingPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-3xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
                    <p className="mt-1 text-slate-600">
                        Manage your plan, invoices, and payment methods.
                    </p>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
                    ← Back to dashboard
                </Link>
            </div>

            <section className="mt-6 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-6">
                <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white grid place-items-center font-semibold">
                        ₹
                    </div>
                    <div className="flex-1">
                        <h2 className="font-semibold">Coming soon</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Billing portal isn’t live yet. You’ll be able to upgrade, cancel, and download invoices here.
                        </p>
                        <div className="mt-4 flex gap-2">
                            <button
                                className="rounded-lg bg-slate-900 px-4 py-2.5 text-white opacity-50 cursor-not-allowed"
                                aria-disabled
                            >
                                Upgrade plan
                            </button>
                            <button
                                className="rounded-lg bg-white px-4 py-2.5 ring-1 ring-slate-200 text-slate-700 cursor-not-allowed"
                                aria-disabled
                            >
                                View invoices
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}