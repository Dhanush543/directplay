// src/components/header/NotificationsBell.tsx
"use client";

import Link from "next/link";
import { useUnreadCount } from "@/lib/notifications-store";

export default function NotificationsBell() {
    const count = useUnreadCount();

    return (
        <Link
            href="/notifications"
            className="relative h-9 w-9 grid place-items-center rounded-full ring-1 ring-slate-200 hover:bg-slate-50"
            aria-label="Notifications"
        >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-700" aria-hidden>
                <path
                    fill="currentColor"
                    d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6v-3a6 6 0 1 0-12 0v3l-2 2v1h16v-1l-2-2Z"
                />
            </svg>
            {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-600 text-white text-[10px] grid place-items-center">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </Link>
    );
}