// src/app/admin/notifications/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";
import { createNotificationAction } from "./actions";
import NotificationActions from "@/components/admin/NotificationActions";

export const dynamic = "force-dynamic";


/* ------------------------------ types ------------------------------ */

type SearchParams = {
    q?: string; // search in title/meta/email/name
    user?: string; // userId filter
    type?: "system" | "email" | "auth" | "";
    page?: string;
};

type Row = {
    id: string;
    title: string;
    meta: string | null;
    type: "system" | "email" | "auth";
    read: boolean;
    createdAt: Date;
    user: { id: string; name: string | null; email: string | null };
};

type SimpleUser = { id: string; name: string | null; email: string | null };

/* -------------------------------- page ----------------------------- */

export default async function AdminNotifications({
    searchParams,
}: {
    // NOTE: await searchParams per Next.js requirement
    searchParams: Promise<SearchParams>;
}) {
    await requireAdminOrNotFound();

    const params = (await searchParams) ?? {};
    const q = params.q ?? "";
    const userIdFilter = params.user ?? "";
    const typeFilter = (params.type ?? "") as SearchParams["type"];

    const currentPage = Math.max(
        1,
        Number.isFinite(Number(params.page)) ? Number(params.page) : 1
    );
    const take = 20;
    const skip = (currentPage - 1) * take;

    // Resolve matching users for q (name/email) then OR against title/meta/userId
    const matchingUserIds: string[] =
        q
            ? (await prisma.user.findMany({
                where: {
                    OR: [
                        { email: { contains: q } },
                        { name: { contains: q } },
                    ],
                },
                select: { id: true },
            })).map((u: { id: string }) => u.id)
            : [];

    const where = {
        ...(userIdFilter ? { userId: userIdFilter } : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(q
            ? {
                OR: [
                    { title: { contains: q } },
                    { meta: { contains: q } },
                    ...(matchingUserIds.length > 0
                        ? [{ userId: { in: matchingUserIds } as any }]
                        : []),
                ],
            }
            : {}),
    } as any;

    const [rows, total, users] = (await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
        }),
        prisma.notification.count({ where }),
        prisma.user.findMany({
            orderBy: { createdAt: "desc" },
            take: 200,
            select: { id: true, name: true, email: true },
        }),
    ])) as [Row[], number, SimpleUser[]];

    const pages = Math.max(1, Math.ceil(total / take));

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <h2 className="font-semibold">Notifications</h2>

                <form className="flex flex-wrap items-center gap-2">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search title, meta, user…"
                        className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm"
                    />

                    <select
                        name="user"
                        defaultValue={userIdFilter}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Filter by user"
                    >
                        <option value="">All users</option>
                        {users.map((u: SimpleUser) => (
                            <option key={u.id} value={u.id}>
                                {u.name ? `${u.name} – ${u.email ?? ""}` : u.email ?? u.id}
                            </option>
                        ))}
                    </select>

                    <select
                        name="type"
                        defaultValue={typeFilter ?? ""}
                        className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        aria-label="Filter by type"
                    >
                        <option value="">All types</option>
                        <option value="system">system</option>
                        <option value="email">email</option>
                        <option value="auth">auth</option>
                    </select>

                    <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                        Apply
                    </button>
                </form>
            </div>

            {/* Composer */}
            <div className="mt-4 rounded-lg border border-slate-200 p-3">
                <h3 className="font-medium">Compose notification</h3>
                <form action={createNotificationAction} className="mt-3 grid gap-3 sm:grid-cols-4">
                    <label className="text-sm sm:col-span-1">
                        <div className="mb-1 text-slate-600">User (by ID)</div>
                        <input
                            name="userId"
                            placeholder="optional if Email is used"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                        />
                    </label>

                    <label className="text-sm sm:col-span-1">
                        <div className="mb-1 text-slate-600">User Email</div>
                        <input
                            type="email"
                            name="email"
                            placeholder="user@example.com"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                        />
                    </label>

                    <label className="text-sm sm:col-span-1">
                        <div className="mb-1 text-slate-600">Type</div>
                        <select
                            name="type"
                            defaultValue="system"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                            required
                        >
                            <option value="system">system</option>
                            <option value="email">email</option>
                            <option value="auth">auth</option>
                        </select>
                    </label>

                    <label className="text-sm sm:col-span-4">
                        <div className="mb-1 text-slate-600">Title</div>
                        <input
                            name="title"
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                            required
                        />
                    </label>

                    <label className="text-sm sm:col-span-4">
                        <div className="mb-1 text-slate-600">Meta (optional)</div>
                        <input
                            name="meta"
                            placeholder='e.g. {"cta":"/learn/xyz"}'
                            className="w-full rounded-md border border-slate-300 px-2 py-1.5"
                        />
                    </label>

                    <div className="sm:col-span-4">
                        <button className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
                            Create
                        </button>
                    </div>
                </form>
            </div>

            {/* History table */}
            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">User</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Title</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Read</th>
                            <th className="px-3 py-2">Created</th>
                            <th className="px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r: Row) => (
                            <tr key={r.id} className="border-t border-slate-200 align-top">
                                <td className="px-3 py-2">
                                    {r.user.name ?? "—"}
                                    <div className="text-xs text-slate-500">{r.user.id}</div>
                                </td>
                                <td className="px-3 py-2">{r.user.email ?? "—"}</td>
                                <td className="px-3 py-2">
                                    <div className="font-medium">{r.title}</div>
                                    {r.meta && (
                                        <div className="mt-1 break-all text-xs text-slate-500">
                                            {r.meta}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs ring-1 ${r.type === "system"
                                            ? "bg-slate-50 text-slate-700 ring-slate-200"
                                            : r.type === "email"
                                                ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                                : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                            }`}
                                    >
                                        {r.type}
                                    </span>
                                </td>
                                <td className="px-3 py-2">
                                    {r.read ? (
                                        <span className="text-emerald-700">Yes</span>
                                    ) : (
                                        <span className="text-slate-600">No</span>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    {new Date(r.createdAt).toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                    <NotificationActions id={r.id} read={r.read} />
                                </td>
                            </tr>
                        ))}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                                    No notifications found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                        Page {currentPage} of {pages} · {total} notifications
                    </span>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter
                                )}&type=${encodeURIComponent(typeFilter ?? "")}&page=${currentPage - 1
                                    }`}
                            >
                                ← Prev
                            </a>
                        )}
                        {currentPage < pages && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&user=${encodeURIComponent(
                                    userIdFilter
                                )}&type=${encodeURIComponent(typeFilter ?? "")}&page=${currentPage + 1
                                    }`}
                            >
                                Next →
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}