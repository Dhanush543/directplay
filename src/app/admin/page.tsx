// src/app/admin/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
    // Strict admin gate (404 for non-admins)
    await requireAdminOrNotFound();

    const [users, courses, lessons, enrollments, notes, notifications] =
        await Promise.all([
            prisma.user.count(),
            prisma.course.count(),
            prisma.lesson.count(),
            prisma.enrollment.count(),
            prisma.lessonNote.count(),
            prisma.notification.count(),
        ]);

    const cards: Array<{ label: string; value: number; href: string }> = [
        { label: "Users", value: users, href: "/admin/users" },
        { label: "Courses", value: courses, href: "/admin/courses" },
        { label: "Lessons", value: lessons, href: "/admin/courses" },
        { label: "Enrollments", value: enrollments, href: "/admin/users" },
        { label: "Notes", value: notes, href: "/admin/users" },
        { label: "Notifications", value: notifications, href: "/admin/users" },
    ];

    return (
        <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((c) => (
                    <Link
                        key={c.label}
                        href={c.href}
                        className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 transition"
                    >
                        <div className="text-slate-500 text-sm">{c.label}</div>
                        <div className="mt-2 text-2xl font-semibold">{c.value}</div>
                    </Link>
                ))}
            </section>

            <section className="mt-8 rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Quick actions</h2>
                <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <li>
                        <Link
                            href="/admin/courses"
                            className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                        >
                            Manage courses & lessons
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/admin/users"
                            className="block rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                        >
                            View users & enrollments
                        </Link>
                    </li>
                </ul>
            </section>
        </>
    );
}