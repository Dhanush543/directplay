// src/components/header/NotificationsBell.tsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useUnreadCount, setUnreadCount } from "@/lib/notifications-store";

/** Shows bell with unread badge. */
export default function NotificationsBell({ count }: { count?: number }) {
    const storeCount = useUnreadCount();
    const visible = typeof count === "number" ? count : storeCount;

    useEffect(() => {
        if (typeof count === "number") setUnreadCount(count);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [count]);

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
            {visible > 0 && (
                <span className="absolute -right-0.5 -top-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-fuchsia-600 text-white text-[10px] grid place-items-center">
                    {visible > 9 ? "9+" : visible}
                </span>
            )}
        </Link>
    );
}