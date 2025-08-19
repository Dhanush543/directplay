//src/app/learn/[slug]/lesson/[index]/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import VideoPlayer from "@/components/VideoPlayer";
import NotesEditor from "@/components/NotesEditor";
import { saveNote, markCompleted } from "./actions";

/** Params must be awaited on Next.js App Router dynamic pages */
type Params = { slug: string; index: string };

export const metadata = {
    title: "Lesson – DirectPlay",
};

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

export default async function LessonPage({
    params,
}: {
    params: Promise<Params>;
}) {
    const { slug, index } = await params;
    const lessonIndex = clamp(Number(index || "1"), 1, 9999);

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");
    const userId = (session.user as { id: string }).id;

    // Resolve course
    const course = await prisma.course.findFirst({
        where: { OR: [{ slug }, { id: slug }] },
        select: { id: true, slug: true, title: true, totalLessons: true },
    });
    if (!course) notFound();

    // Enrollment gate
    const enrolled = await prisma.enrollment.findFirst({
        where: { userId, courseId: course.id },
        select: { id: true },
    });
    if (!enrolled) redirect(`/courses?need_enroll=${encodeURIComponent(course.slug ?? course.id)}`);

    const total = course.totalLessons ?? 0;
    if (total === 0) {
        // No lessons published yet
        return (
            <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
                <h1 className="text-2xl font-bold">{course.title}</h1>
                <p className="mt-2 text-slate-600">Lessons for this course aren’t published yet.</p>
                <Link href={`/learn/${course.slug ?? course.id}`} className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
                    ← Back to course overview
                </Link>
            </main>
        );
    }

    // Build synthetic lessons (IDs align with your seed convention)
    const allLessons = Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        const id = `${course.slug ?? course.id}-${idx}`;
        return { id, index: idx, title: `Lesson ${idx}` };
    });

    const current = allLessons[lessonIndex - 1] ?? allLessons[0];

    // Fetch existing note
    const existingNote = await prisma.lessonNote.findUnique({
        where: {
            userId_courseId_lessonId: {
                userId,
                courseId: course.id,
                lessonId: current.id,
            },
        },
        select: { content: true },
    });

    // Fetch completion info (to show “Completed” and disable button)
    const completion = await prisma.lessonProgress.findUnique({
        where: {
            userId_courseId_lessonId: {
                userId,
                courseId: course.id,
                lessonId: current.id,
            },
        },
        select: { completed: true },
    });

    // Simple demo video source (replace with real CDN/YouTube later)
    const demoSrc = "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

    const prev = lessonIndex > 1 ? allLessons[lessonIndex - 2] : null;
    const next = lessonIndex < total ? allLessons[lessonIndex] : null;

    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{course.title}</h1>
                    <p className="mt-1 text-slate-600">Lesson {current.index}</p>
                </div>
                <Link href={`/learn/${course.slug ?? course.id}`} className="text-indigo-600 hover:text-indigo-700">
                    My Courses →
                </Link>
            </div>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Player + info */}
                <section className="lg:col-span-2 space-y-4">
                    <VideoPlayer src={demoSrc} />

                    <div className="flex items-center justify-between">
                        <div className="text-slate-700 font-medium">{current.title}</div>
                        <form action={async (fd: FormData) => {
                            fd.set("courseId", course.id);
                            fd.set("lessonId", current.id);
                            await markCompleted(fd);
                        }}>
                            <button
                                type="submit"
                                className="rounded-md bg-slate-900 text-white text-sm px-3 py-1.5 hover:bg-slate-800 disabled:opacity-50"
                                disabled={!!completion?.completed}
                            >
                                {completion?.completed ? "Completed ✓" : "Mark complete"}
                            </button>
                        </form>
                    </div>

                    {/* Lesson content (placeholder copy for now) */}
                    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-4">
                        <h3 className="font-semibold">About this lesson</h3>
                        <p className="mt-2 text-sm text-slate-700">
                            This section is where you’ll place lesson text, links, code snippets, or downloadable resources.
                            You can wire it to your CMS later. For now, it’s static copy to demonstrate layout.
                        </p>
                    </div>

                    {/* Notes */}
                    <NotesEditor
                        initial={existingNote?.content ?? ""}
                        lessonId={current.id}
                        onSave={async (fd: FormData) => {
                            fd.set("courseId", course.id);
                            await saveNote(fd);
                        }}
                    />

                    {/* Prev/Next */}
                    <div className="flex items-center justify-between">
                        {prev ? (
                            <Link
                                href={`/learn/${course.slug ?? course.id}/lesson/${prev.index}`}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                ← Lesson {prev.index}
                            </Link>
                        ) : <span />}
                        {next ? (
                            <Link
                                href={`/learn/${course.slug ?? course.id}/lesson/${next.index}`}
                                className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                                Lesson {next.index} →
                            </Link>
                        ) : <span />}
                    </div>
                </section>

                {/* Right: Up Next list */}
                <aside className="space-y-3">
                    <div className="rounded-xl ring-1 ring-slate-200 bg-white p-3">
                        <div className="font-semibold mb-2">Up next</div>
                        <ul className="space-y-1">
                            {allLessons.map((l) => {
                                const isActive = l.index === current.index;
                                return (
                                    <li key={l.id}>
                                        <Link
                                            href={`/learn/${course.slug ?? course.id}/lesson/${l.index}`}
                                            className={[
                                                "flex items-center justify-between rounded-md px-3 py-2 text-sm",
                                                isActive ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-700",
                                            ].join(" ")}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            <span>{l.title}</span>
                                            {isActive ? <span className="opacity-80">Now</span> : <span>Open</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </aside>
            </div>
        </main>
    );
}