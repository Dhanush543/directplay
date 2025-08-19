// src/app/error.tsx
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

// Client error boundary: can use next-auth's useSession to tailor buttons
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const { data: session } = useSession();
    const isAuthed = !!session?.user;

    useEffect(() => {
        // Optional: log to your analytics/observability here
        // console.error(error);
    }, [error]);

    return (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="text-xs font-semibold tracking-widest text-violet-600">Error</div>
                <h1 className="mt-2 text-3xl font-extrabold">Something went wrong</h1>
                <p className="mt-2 text-slate-600">Try again, or head back.</p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button onClick={reset}>Try again</Button>

                    {/* Primary “home” depends on auth */}
                    <Button asChild variant="secondary">
                        <Link href={isAuthed ? "/dashboard" : "/"}>{isAuthed ? "Go to dashboard" : "Go home"}</Link>
                    </Button>

                    {/* Always useful */}
                    <Button asChild variant="secondary">
                        <Link href="/courses">Browse courses</Link>
                    </Button>

                    {/* Extra affordance for logged-out users */}
                    {!isAuthed && (
                        <Button asChild variant="ghost">
                            <Link href="/auth?view=signin">Sign in</Link>
                        </Button>
                    )}
                </div>
            </div>
        </main>
    );
}