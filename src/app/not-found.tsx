import Link from "next/link";

export default function NotFound() {
    return (
        <main className="relative">
            {/* Soft hero glow (static) */}
            <div className="absolute inset-x-0 top-0 -z-10 h-[240px] sm:h-[280px] bg-[radial-gradient(1200px_360px_at_50%_0%,rgba(99,102,241,.22),rgba(236,72,153,.18),transparent_70%)]" />

            <section className="min-h-[calc(100vh-4rem)] flex items-center">
                <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
                    <div className="rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-xl shadow-slate-900/5 p-8 sm:p-10 text-center">
                        <p className="text-sm font-semibold text-indigo-600">404</p>
                        <h1 className="mt-2 text-3xl font-extrabold">Page not found</h1>
                        <p className="mt-2 text-slate-600">
                            The page you’re looking for doesn’t exist or was moved.
                        </p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                            >
                                Go home
                            </Link>
                            <Link
                                href="/#courses"
                                className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2.5 text-slate-900 ring-1 ring-slate-200 hover:ring-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                            >
                                Browse courses
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}