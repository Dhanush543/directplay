export default function PricingLoading() {
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" role="status" aria-busy="true">
            {/* Hero */}
            <div className="h-8 w-72 rounded bg-slate-200/80" />
            <div className="mt-2 h-4 w-[32rem] max-w-full rounded bg-slate-200/70" />

            {/* Tiers */}
            <div className="mt-8 grid gap-6 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="h-5 w-28 rounded bg-slate-200/80" />
                        <div className="mt-4 h-8 w-24 rounded bg-slate-200/80" />
                        <div className="mt-6 space-y-3">
                            <div className="h-4 w-5/6 rounded bg-slate-200/70" />
                            <div className="h-4 w-4/5 rounded bg-slate-200/70" />
                            <div className="h-4 w-3/5 rounded bg-slate-200/70" />
                            <div className="h-4 w-2/3 rounded bg-slate-200/70" />
                        </div>
                        <div className="mt-6 h-10 w-full rounded-lg bg-slate-200/80" />
                    </div>
                ))}
            </div>

            {/* FAQs */}
            <div className="mt-12 grid gap-4 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="h-4 w-1/2 rounded bg-slate-200/80" />
                        <div className="mt-3 space-y-2">
                            <div className="h-4 w-full rounded bg-slate-200/70" />
                            <div className="h-4 w-5/6 rounded bg-slate-200/70" />
                            <div className="h-4 w-2/3 rounded bg-slate-200/70" />
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}