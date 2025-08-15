// src/app/notifications/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { setUnreadCount } from "@/lib/notifications-store";

type Item = {
    id: string;
    title: string;
    meta: string;
    read: boolean;
    type: "auth" | "email" | "system";
};

const LS_KEY = "dp_notifications_items_v1";

// default seed (used only the first time)
const seed: Item[] = [
    { id: "1", title: "Welcome to DirectPlay", meta: "Email · just now", read: false, type: "email" },
    { id: "2", title: "Signed in securely", meta: "Auth · 2m ago", read: false, type: "auth" },
    { id: "3", title: "New project templates", meta: "System · 1d ago", read: true, type: "system" },
];

function loadItems(): Item[] {
    if (typeof window === "undefined") return seed;
    try {
        const raw = window.localStorage.getItem(LS_KEY);
        if (!raw) return seed;
        const parsed = JSON.parse(raw) as Item[];
        if (!Array.isArray(parsed)) return seed;
        // very light validation
        return parsed.map((x) => ({
            id: String(x.id),
            title: String(x.title),
            meta: String(x.meta),
            read: Boolean(x.read),
            type: x.type === "auth" || x.type === "system" ? x.type : "email",
        }));
    } catch {
        return seed;
    }
}

function saveItems(items: Item[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_KEY, JSON.stringify(items));
}

export default function NotificationsPage() {
    const [items, setItems] = useState<Item[]>(() => loadItems());
    const [tab, setTab] = useState<"all" | "unread">("all");

    // Keep unread count in header synced + persist list on change
    const unread = useMemo(() => items.filter((i) => !i.read).length, [items]);

    useEffect(() => {
        saveItems(items);
        setUnreadCount(unread); // updates bell via external store (safe)
    }, [items, unread]);

    const filtered = useMemo(
        () => (tab === "unread" ? items.filter((i) => !i.read) : items),
        [items, tab]
    );

    const markAll = () => setItems((xs) => xs.map((x) => ({ ...x, read: true })));
    const markOne = (id: string) =>
        setItems((xs) => xs.map((x) => (x.id === id ? { ...x, read: true } : x)));

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-3xl">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
                    <p className="mt-1 text-slate-600">Stay on top of what’s new.</p>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
                    ← Back to dashboard
                </Link>
            </div>

            <div className="mt-6 flex items-center justify-between">
                <div className="inline-flex rounded-lg ring-1 ring-slate-200 bg-white p-1">
                    <button
                        onClick={() => setTab("all")}
                        className={[
                            "px-3 py-1.5 text-sm rounded-md",
                            tab === "all" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setTab("unread")}
                        className={[
                            "px-3 py-1.5 text-sm rounded-md",
                            tab === "unread" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        Unread
                    </button>
                </div>

                <button
                    onClick={markAll}
                    className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
                    disabled={unread === 0}
                >
                    Mark all as read
                </button>
            </div>

            <section className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                {filtered.length === 0 ? (
                    <div className="p-6 text-sm text-slate-600">You’re all caught up 🎉</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {filtered.map((n) => (
                            <li key={n.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <Badge type={n.type} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium">{n.title}</div>
                                            {!n.read && (
                                                <span className="ml-3 inline-block h-2 w-2 rounded-full bg-fuchsia-600" />
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">{n.meta}</div>
                                        {!n.read && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => markOne(n.id)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-700"
                                                >
                                                    Mark as read
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}

function Badge({ type }: { type: Item["type"] }) {
    const map = {
        email: "bg-blue-100 text-blue-700",
        auth: "bg-emerald-100 text-emerald-700",
        system: "bg-slate-100 text-slate-700",
    } as const;
    const label = type === "system" ? "System" : type === "auth" ? "Auth" : "Email";
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] ${map[type]}`}>
            {label}
        </span>
    );
}