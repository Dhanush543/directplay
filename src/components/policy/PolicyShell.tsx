// src/components/policy/PolicyShell.tsx
import { ReactNode } from "react";

export default function PolicyShell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <main className="relative">
            {/* Soft hero glow (same vibe as Contact/Auth) */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[240px] sm:h-[280px] bg-[radial-gradient(1200px_360px_at_50%_0%,rgba(99,102,241,.22),rgba(236,72,153,.18),transparent_70%)]" />

            {/* Page body */}
            <section className="min-h-[calc(100vh-4rem)] flex flex-col">
                {/* Heading */}
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
                    <h1 className="text-3xl font-extrabold">{title}</h1>
                    {subtitle ? <p className="mt-1 text-slate-600">{subtitle}</p> : null}
                </div>

                {/* Card frame */}
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex-1 min-h-0 pb-10 mt-6">
                    <div className="w-full rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-xl shadow-slate-900/5 p-4 sm:p-6 min-h-0">
                        <article className="prose prose-slate max-w-none">
                            {children}
                        </article>
                    </div>
                </div>
            </section>
        </main>
    );
}