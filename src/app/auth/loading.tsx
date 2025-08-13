export default function AuthLoading() {
    return (
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10" role="status" aria-busy="true">
            {/* Heading */}
            <div className="h-8 w-72 rounded bg-slate-200/80" />
            <div className="mt-2 h-4 w-96 rounded bg-slate-200/70" />

            {/* Frame */}
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Card 1 */}
                    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="h-5 w-24 rounded bg-slate-200/80" />
                        <div className="mt-2 h-4 w-64 rounded bg-slate-200/70" />
                        <div className="mt-5 h-11 w-full rounded-full bg-slate-200/80" />
                        <div className="mt-4 h-10 w-full rounded-lg bg-slate-200/70" />
                        <div className="mt-3 h-10 w-full rounded-lg bg-slate-200/70" />
                        <div className="mt-4 h-10 w-full rounded-lg bg-slate-200/80" />
                    </div>
                    {/* Card 2 */}
                    <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="h-5 w-28 rounded bg-slate-200/80" />
                        <div className="mt-2 h-4 w-64 rounded bg-slate-200/70" />
                        <div className="mt-6 space-y-3">
                            <div className="h-4 w-5/6 rounded bg-slate-200/70" />
                            <div className="h-4 w-4/5 rounded bg-slate-200/70" />
                            <div className="h-4 w-3/5 rounded bg-slate-200/70" />
                        </div>
                        <div className="mt-6 h-10 w-40 rounded-lg bg-slate-200/80" />
                    </div>
                </div>
            </div>
        </main>
    );
}