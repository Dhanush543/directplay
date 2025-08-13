export default function CourseSlugLoading() {
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10" role="status" aria-busy="true">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2">
                <div className="h-4 w-16 rounded bg-slate-200/70" />
                <div className="h-3 w-3 rounded-full bg-slate-200/70" />
                <div className="h-4 w-24 rounded bg-slate-200/70" />
            </div>

            {/* Title */}
            <div className="mt-4 h-8 w-2/3 rounded bg-slate-200/80" />
            <div className="mt-2 h-4 w-1/2 rounded bg-slate-200/70" />

            {/* Player + Sidebar */}
            <div className="mt-6 grid gap-6 lg:grid-cols-[2fr,1fr]">
                {/* Player area (16:9) */}
                <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                    <div className="aspect-video w-full rounded-lg bg-slate-200/80" />
                    <div className="mt-4 space-y-2">
                        <div className="h-4 w-2/3 rounded bg-slate-200/70" />
                        <div className="h-4 w-1/2 rounded bg-slate-200/70" />
                    </div>
                </div>

                {/* Sidebar outline */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="h-5 w-28 rounded bg-slate-200/80" />
                    <div className="mt-4 space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-4 w-full rounded bg-slate-200/70" />
                        ))}
                    </div>
                </div>
            </div>
        </main>
    );
}