// src/app/settings/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-4xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="mt-1 text-slate-600">
                        Manage account, security and notifications. Most controls are placeholders for now.
                    </p>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
                    ← Back to dashboard
                </Link>
            </div>

            <div className="mt-6 space-y-6">
                {/* Account */}
                <section className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
                    <h2 className="font-semibold">Account</h2>
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Email</label>
                            <input
                                className="mt-1 w-full rounded-lg border-slate-300 ring-1 ring-slate-200 bg-slate-50 px-3 py-2 text-sm"
                                defaultValue={session.user.email ?? ""}
                                disabled
                            />
                            <p className="mt-1 text-xs text-slate-500">
                                Email is your login identity (magic links). Change coming later.
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Timezone</label>
                            <select className="mt-1 w-full rounded-lg ring-1 ring-slate-200 bg-white px-3 py-2 text-sm" disabled>
                                <option>Auto-detect</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Security */}
                <section className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
                    <h2 className="font-semibold">Security</h2>
                    <div className="mt-4 grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">
                                Two-factor authentication
                            </label>
                            <div className="mt-1 flex items-center gap-3">
                                <span className="inline-flex h-5 w-9 items-center rounded-full bg-slate-200 px-0.5 text-[0] cursor-not-allowed" aria-disabled />
                                <span className="text-sm text-slate-600">Coming soon</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Active sessions</label>
                            <button className="mt-1 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 cursor-not-allowed" aria-disabled>
                                Review sessions
                            </button>
                        </div>
                    </div>
                </section>

                {/* Notifications */}
                <section className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
                    <h2 className="font-semibold">Notifications</h2>
                    <div className="mt-4 grid gap-3">
                        <ToggleRow label="Product updates" hint="Occasional updates about new lessons and features." />
                        <ToggleRow label="Weekly progress report" hint="Your study time and streak summary." />
                        <ToggleRow label="Reminders" hint="Gentle nudges to keep your streak going." />
                    </div>

                    <div className="mt-5">
                        <button
                            className="rounded-lg bg-slate-900 px-4 py-2.5 text-white opacity-50 cursor-not-allowed"
                            aria-disabled
                        >
                            Save preferences
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}

function ToggleRow({ label, hint }: { label: string; hint?: string }) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
            <div>
                <div className="text-sm font-medium">{label}</div>
                {hint && <div className="text-xs text-slate-500 mt-0.5">{hint}</div>}
            </div>
            <span
                className="inline-flex h-5 w-9 items-center rounded-full bg-slate-200 px-0.5 text-[0] cursor-not-allowed"
                title="Coming soon"
                aria-disabled
            />
        </div>
    );
}