// src/app/courses/loading.tsx
export default function CoursesLoading() {
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="mb-6">
                <div className="h-8 w-48 rounded-md bg-slate-200 animate-pulse" />
                <div className="mt-2 h-5 w-96 rounded-md bg-slate-100 animate-pulse" />
            </header>

            {/* grid skeleton */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-slate-200 p-4 bg-white shadow-sm"
                    >
                        <div className="h-5 w-2/3 bg-slate-200 rounded-md animate-pulse" />
                        <div className="mt-2 h-4 w-24 bg-slate-100 rounded-md animate-pulse" />
                        <div className="mt-5 space-y-2">
                            <div className="h-3 w-full bg-slate-100 rounded-md animate-pulse" />
                            <div className="h-3 w-11/12 bg-slate-100 rounded-md animate-pulse" />
                            <div className="h-3 w-10/12 bg-slate-100 rounded-md animate-pulse" />
                        </div>
                        <div className="mt-6 h-9 w-28 bg-slate-200 rounded-md animate-pulse" />
                    </div>
                ))}
            </div>
        </main>
    );
}