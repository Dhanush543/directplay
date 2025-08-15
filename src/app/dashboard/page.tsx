// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock4, Mail, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

// Tiny helpers
function pct(n: number) {
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    const displayName = session.user.name || session.user.email?.split("@")[0] || "there";
    const stats = [
        { label: "Lessons completed", value: 12, delta: "+3 this week", icon: <BookOpen className="h-4 w-4" aria-hidden /> },
        { label: "Study time", value: "4h 20m", delta: "+45m today", icon: <Clock4 className="h-4 w-4" aria-hidden /> },
        { label: "Streak", value: "5 days", delta: "Keep it going", icon: <TrendingUp className="h-4 w-4" aria-hidden /> },
    ];
    const progress = [
        { title: "JavaScript Foundations", pct: 72 },
        { title: "React Essentials", pct: 45 },
        { title: "TypeScript Basics", pct: 18 },
    ];
    const recent = [
        { title: "Welcome to DirectPlay", meta: "Email · just now", icon: <Mail className="h-4 w-4" aria-hidden /> },
        { title: "Signed in securely", meta: "Auth · 2m ago", icon: <ShieldCheck className="h-4 w-4" aria-hidden /> },
    ];

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-8 mx-auto w-full max-w-6xl">
            {/* Page header */}
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                        Welcome back, <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">{displayName}</span> 👋
                    </h1>
                    <p className="mt-1 text-slate-600">
                        Pick up where you left off, keep your streak alive, and ship something today.
                    </p>
                </div>

                {/* NEW: “Resume lesson” primary CTA (header handles sign-out now) */}
                <div className="flex gap-2">
                    <Link
                        href="/learn"
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2.5 hover:bg-slate-800 transition"
                    >
                        Resume lesson <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                </div>
            </header>

            {/* Stats */}
            <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-slate-500 text-sm">{s.label}</div>
                            <div className="text-slate-500">{s.icon}</div>
                        </div>
                        <div className="mt-2 text-2xl font-semibold">{s.value}</div>
                        <div className="mt-1 text-xs text-emerald-600">{s.delta}</div>
                    </div>
                ))}
            </section>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Learning progress */}
                <section className="lg:col-span-2 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-600" aria-hidden />
                        <h2 className="font-semibold">Your learning progress</h2>
                    </div>

                    <ul className="mt-4 space-y-4">
                        {progress.map((p) => (
                            <li key={p.title} className="rounded-xl border border-slate-200 p-3">
                                <div className="flex items-center justify-between">
                                    <div className="font-medium">{p.title}</div>
                                    <div className="text-sm text-slate-600">{pct(p.pct)}%</div>
                                </div>
                                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-fuchsia-600"
                                        style={{ width: `${pct(p.pct)}%` }}
                                        aria-label={`${p.title} ${pct(p.pct)} percent complete`}
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4 flex justify-end">
                        <Link
                            href="/courses"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            View all courses →
                        </Link>
                    </div>
                </section>

                {/* Recent activity */}
                <aside className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4">
                    <h2 className="font-semibold">Recent</h2>
                    <ul className="mt-3 divide-y divide-slate-200">
                        {recent.map((r, i) => (
                            <li key={i} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 text-slate-500">{r.icon}</div>
                                    <div>
                                        <div className="text-sm font-medium">{r.title}</div>
                                        <div className="text-xs text-slate-500">{r.meta}</div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-4">
                        <Link
                            href="/notifications"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                            See all notifications →
                        </Link>
                    </div>
                </aside>
            </div>

            {/* Quick actions */}
            <section className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-fuchsia-50 ring-1 ring-slate-200 p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-slate-900">Keep the streak going</h3>
                        <p className="text-sm text-slate-600">Do a 10-minute lesson now and maintain your momentum.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/learn/quick-lesson"
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-3.5 py-2.5 hover:bg-slate-800"
                        >
                            10-min lesson <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                            Explore projects
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}