// src/app/admin/layout.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminOrNotFound } from "@/lib/auth";

/** Keep admin pages out of search engines */
export const metadata: Metadata = {
    robots: {
        index: false,
        follow: false,
        nocache: true,
    },
};


export const dynamic = "force-dynamic";

export async function headers() {
    return {
        "X-Robots-Tag": "noindex, nofollow, noarchive",
    };
}

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Server-side RBAC gate (404 for non-admins)
    await requireAdminOrNotFound();

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {/* Shell: left rail + content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left rail */}
                <aside className="lg:col-span-3">
                    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                        <div className="p-4 border-b border-slate-200">
                            <h1 className="text-xl font-semibold">Admin</h1>
                            <p className="mt-1 text-sm text-slate-600">
                                Manage users, courses, lessons & more.
                            </p>
                        </div>
                        <nav className="p-2">
                            <ul className="space-y-1">
                                <li>
                                    <Link
                                        href="/admin"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Overview
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/users"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Users
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/courses"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Courses
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/media"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Media Library
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/enrollments"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Enrollments
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/notifications"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Notifications
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/settings"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Settings
                                    </Link>
                                </li>
                                <li>
                                    <Link
                                        href="/admin/audit"
                                        className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                                    >
                                        Audit Log
                                    </Link>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </aside>

                {/* Content */}
                <section className="lg:col-span-9 min-w-0">{children}</section>
            </div>
        </div>
    );
}