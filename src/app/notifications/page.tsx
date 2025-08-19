// src/app/notifications/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { markAllRead, markOneRead } from "./actions";
import SyncUnread from "@/components/SyncUnread";

type SearchParams = { tab?: "all" | "unread" };

export default async function NotificationsPage({
    searchParams,
}: {
    // Next 15 dynamic APIs are async
    searchParams: Promise<SearchParams>;
}) {
    const { tab: tabRaw } = await searchParams;
    const tab = (tabRaw ?? "all") as "all" | "unread";

    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");
    const userId = (session.user as any).id as string;

    const items = await prisma.notification.findMany({
        where: { userId, ...(tab === "unread" ? { read: false } : {}) },
        orderBy: { createdAt: "desc" },
    });

    type NotificationRow = (typeof items)[number];

    const unreadCount = await prisma.notification.count({
        where: { userId, read: false },
    });

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-3xl">
            {/* sync header bell on mount (client component) */}
            <SyncUnread count={unreadCount} />

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
                    <Link
                        href="/notifications?tab=all"
                        className={[
                            "px-3 py-1.5 text-sm rounded-md",
                            tab === "all" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        All
                    </Link>
                    <Link
                        href="/notifications?tab=unread"
                        className={[
                            "px-3 py-1.5 text-sm rounded-md",
                            tab === "unread" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                    >
                        Unread
                    </Link>
                </div>

                <form action={markAllRead}>
                    <button
                        className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
                        disabled={unreadCount === 0}
                    >
                        Mark all as read
                    </button>
                </form>
            </div>

            <section className="mt-4 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm">
                {items.length === 0 ? (
                    <div className="p-6 text-sm text-slate-600">You’re all caught up 🎉</div>
                ) : (
                    <ul className="divide-y divide-slate-200">
                        {items.map((n: NotificationRow) => (
                            <li key={n.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <Badge type={n.type as unknown as "auth" | "email" | "system"} />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm font-medium">{n.title}</div>
                                            {!n.read && (
                                                <span className="ml-3 inline-block h-2 w-2 rounded-full bg-fuchsia-600" />
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5">
                                            {n.meta ??
                                                ((n.type as unknown) === "auth"
                                                    ? "Auth"
                                                    : (n.type as unknown) === "email"
                                                        ? "Email"
                                                        : "System")}
                                        </div>
                                        {!n.read && (
                                            <div className="mt-2">
                                                <form action={markOneRead}>
                                                    <input type="hidden" name="id" value={n.id} />
                                                    <button className="text-xs text-indigo-600 hover:text-indigo-700">
                                                        Mark as read
                                                    </button>
                                                </form>
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

function Badge({ type }: { type: "auth" | "email" | "system" }) {
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