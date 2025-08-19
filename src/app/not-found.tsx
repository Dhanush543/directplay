// src/app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { safeGetServerSession } from "@/lib/auth";

export default async function NotFound() {
    const session = await safeGetServerSession();
    const homeHref = session?.user ? "/dashboard" : "/";

    return (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <div className="text-xs font-semibold tracking-widest text-violet-600">404</div>
                <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
                <p className="mt-2 text-slate-600">
                    The page you’re looking for doesn’t exist or was moved.
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                    <Button asChild>
                        <Link href={homeHref}>Go home</Link>
                    </Button>
                    <Button asChild variant="secondary">
                        <Link href="/courses">Browse courses</Link>
                    </Button>
                </div>
            </div>
        </main>
    );
}