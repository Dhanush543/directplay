"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // You can log to analytics here if you want
        // console.error(error);
    }, [error]);

    return (
        <main className="relative">
            {/* Soft hero glow (static) */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[240px] sm:h-[280px] bg-[radial-gradient(1200px_360px_at_50%_0%,rgba(99,102,241,.22),rgba(236,72,153,.18),transparent_70%)]" />

            <section className="min-h-[calc(100vh-4rem)] flex items-center">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
                    <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
                        <p className="text-sm font-semibold text-rose-600">Something went wrong</p>
                        <h1 className="mt-2 text-3xl font-extrabold">We hit a snag</h1>
                        <p className="mt-2 text-slate-600">
                            An unexpected error occurred. Try again, or go back home.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                onClick={() => reset()}
                                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                            >
                                Try again
                            </button>
                            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-lg border px-4">
                                Go home
                            </Link>
                        </div>
                        {error?.digest ? (
                            <p className="mt-4 text-xs text-slate-400">Error ID: {error.digest}</p>
                        ) : null}
                    </div>
                </div>
            </section>
        </main>
    );
}