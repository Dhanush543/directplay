// src/components/admin/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Image as ImageIcon,
    GraduationCap,
    Bell,
    StickyNote,
    Settings,
    ShieldCheck,
} from "lucide-react";
import * as React from "react";

/**
 * AdminNav – left sidebar navigation for the admin area.
 * Responsive: collapses to top bar on < md via the parent layout.
 */

type NavItem = {
    href: string;
    label: string;
    icon: React.ReactNode;
    /** Optional predicate to hide the item at runtime (e.g., feature flags). */
    visible?: boolean;
};

function cx(...classes: Array<string | false | null | undefined>): string {
    return classes.filter(Boolean).join(" ");
}

export default function AdminNav() {
    const pathname = usePathname();

    const items: NavItem[] = React.useMemo(
        () => [
            {
                href: "/admin",
                label: "Dashboard",
                icon: <LayoutDashboard className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/users",
                label: "Users",
                icon: <Users className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/courses",
                label: "Courses",
                icon: <BookOpen className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/media",
                label: "Media",
                icon: <ImageIcon className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/enrollments",
                label: "Enrollments",
                icon: <GraduationCap className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/notifications",
                label: "Notifications",
                icon: <Bell className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/notes",
                label: "Notes",
                icon: <StickyNote className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/settings",
                label: "Settings",
                icon: <Settings className="h-4 w-4" aria-hidden />,
            },
            {
                href: "/admin/audit",
                label: "Audit Log",
                icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
            },
        ],
        []
    );

    return (
        <nav
            aria-label="Admin navigation"
            className="w-full md:w-60 shrink-0 border-r border-slate-200 bg-white"
        >
            <div className="p-3">
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Admin
                </div>
                <ul className="space-y-1">
                    {items
                        .filter((it) => it.visible !== false)
                        .map((it) => {
                            const active =
                                pathname === it.href || pathname?.startsWith(it.href + "/");
                            return (
                                <li key={it.href}>
                                    <Link
                                        href={it.href}
                                        className={cx(
                                            "group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition",
                                            active
                                                ? "bg-slate-100 text-slate-900"
                                                : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        <span
                                            className={cx(
                                                "text-slate-500 group-hover:text-slate-700",
                                                active && "text-slate-900"
                                            )}
                                        >
                                            {it.icon}
                                        </span>
                                        <span className="truncate">{it.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                </ul>
            </div>
        </nav>
    );
}