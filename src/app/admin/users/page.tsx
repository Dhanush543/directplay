// src/app/admin/users/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Search = { q?: string; page?: string };

/* ---------------- server actions ---------------- */
async function toggleRole(formData: FormData) {
    "use server";
    await requireAdminOrNotFound();

    const userId = String(formData.get("userId") ?? "");
    const roleRaw = String(formData.get("role") ?? "");
    const nextRole = roleRaw === "admin" ? "admin" : "user";

    if (!userId) throw new Error("Missing userId");

    // Optional: protect against removing the last admin
    if (nextRole === "user") {
        const adminCount = await prisma.user.count({ where: { role: "admin" } });
        const thisUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });
        if (thisUser?.role === "admin" && adminCount <= 1) {
            throw new Error("Cannot demote the last admin");
        }
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role: nextRole },
    });
}

export default async function AdminUsers({
    searchParams,
}: {
    searchParams: Promise<Search>;
}) {
    await requireAdminOrNotFound();

    const { q = "", page = "1" } = await searchParams;

    const currentPage: number = Math.max(
        1,
        Number.isFinite(Number(page)) ? Number(page) : 1
    );
    const take = 20;
    const skip = (currentPage - 1) * take;

    const where =
        q && q.trim().length > 0
            ? {
                OR: [
                    { email: { contains: q, mode: "insensitive" as const } },
                    { name: { contains: q, mode: "insensitive" as const } },
                ],
            }
            : {};

    const [rows, total, adminCount] = await Promise.all([
        prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            take,
            skip,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                _count: { select: { enrollments: true, lessonNotes: true } },
            },
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { role: "admin" } }),
    ]);

    const pages: number = Math.max(1, Math.ceil(total / take));

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-semibold">Users</h2>
                    <p className="text-xs text-slate-600">
                        Total: <span className="font-medium">{total}</span> · Admins:{" "}
                        <span className="font-medium">{adminCount}</span>
                    </p>
                </div>
                <form className="flex items-center gap-2">
                    <input
                        name="q"
                        defaultValue={q}
                        placeholder="Search name or email…"
                        className="h-9 w-64 rounded-md border border-slate-200 px-3 text-sm"
                    />
                    <button className="h-9 rounded-md bg-slate-900 px-3 text-sm font-medium text-white">
                        Search
                    </button>
                </form>
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Enrollments</th>
                            <th className="px-3 py-2">Notes</th>
                            <th className="px-3 py-2">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((u: {
                            id: string;
                            name: string | null;
                            email: string | null;
                            role: "user" | "admin" | null;
                            createdAt: Date;
                            _count: { enrollments: number; lessonNotes: number };
                        }) => (
                            <tr key={u.id} className="border-t border-slate-200">
                                <td className="px-3 py-2">{u.name ?? "—"}</td>
                                <td className="px-3 py-2">{u.email ?? "—"}</td>
                                <td className="px-3 py-2">
                                    <form action={toggleRole}>
                                        <input type="hidden" name="userId" value={u.id} />
                                        <select
                                            name="role"
                                            defaultValue={u.role ?? "user"}
                                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                                const form = e.currentTarget.form;
                                                if (form) form.requestSubmit();
                                            }}
                                        >
                                            <option value="user">user</option>
                                            <option value="admin">admin</option>
                                        </select>
                                    </form>
                                </td>
                                <td className="px-3 py-2">{u._count.enrollments}</td>
                                <td className="px-3 py-2">{u._count.lessonNotes}</td>
                                <td className="px-3 py-2">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {pages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-slate-600">
                        Page {currentPage} of {pages} · {total} users
                    </span>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&page=${currentPage - 1}`}
                            >
                                ← Prev
                            </a>
                        )}
                        {currentPage < pages && (
                            <a
                                className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50"
                                href={`?q=${encodeURIComponent(q)}&page=${currentPage + 1}`}
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