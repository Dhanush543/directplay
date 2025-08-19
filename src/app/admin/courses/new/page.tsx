// src/app/admin/courses/new/page.tsx
import { requireAdminOrNotFound } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function createCourseAction(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    if (!title || !slug) {
        throw new Error("Title and slug are required.");
    }

    // Ensure slug uniqueness
    const existing = await prisma.course.findFirst({
        where: { slug },
        select: { id: true },
    });
    if (existing) {
        throw new Error("Slug is already in use.");
    }

    const course = await prisma.course.create({
        data: {
            title,
            slug,
            published: false,
            comingSoon: true,
        },
    });

    redirect(`/admin/courses/${course.id}`);
}

export default async function NewCoursePage() {
    await requireAdminOrNotFound();

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <h2 className="font-semibold">Create new course</h2>
            <form action={createCourseAction} className="mt-4 grid gap-3 max-w-xl">
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Title</div>
                    <input
                        name="title"
                        className="w-full rounded-md border border-slate-200 px-3 py-2"
                        required
                    />
                </label>
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Slug</div>
                    <input
                        name="slug"
                        className="w-full rounded-md border border-slate-200 px-3 py-2"
                        required
                    />
                </label>
                <button className="mt-2 inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                    Create
                </button>
            </form>
        </div>
    );
}