// src/app/admin/audit/page.tsx
import prisma from "@/lib/prisma";
import { requireAdminOrNotFound } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Row = {
    id: string;
    createdAt: Date;
    actor: { id: string; name: string | null; email: string | null } | null;
    action: string;
    entity: string;
    summary: string | null;
    payload: unknown | null;
};

export default async function AdminAuditPage() {
    await requireAdminOrNotFound();

    // Fetch recent audit logs (latest 200)
    const rows: Row[] = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
            id: true,
            createdAt: true,
            action: true,
            entity: true,
            summary: true,
            payload: true,
            actor: { select: { id: true, name: true, email: true } },
        },
    });

    return (
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
            <h2 className="font-semibold">Audit log</h2>
            <p className="mt-1 text-sm text-slate-600">
                Most recent 200 actions. This log records admin activity and sensitive
                operations.
            </p>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="text-left text-slate-500">
                            <th className="px-3 py-2">Time</th>
                            <th className="px-3 py-2">Actor</th>
                            <th className="px-3 py-2">Action</th>
                            <th className="px-3 py-2">Entity</th>
                            <th className="px-3 py-2">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r: Row) => (
                            <tr key={r.id} className="border-t border-slate-200">
                                <td className="px-3 py-2 whitespace-nowrap">
                                    {new Date(r.createdAt).toLocaleString()}
                                </td>
                                <td className="px-3 py-2">
                                    {r.actor?.name ?? r.actor?.email ?? "—"}
                                    {r.actor?.email && r.actor?.name && (
                                        <div className="text-xs text-slate-500">{r.actor.email}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 font-medium">{r.action}</td>
                                <td className="px-3 py-2">{r.entity ?? "—"}</td>
                                <td className="px-3 py-2 max-w-xs break-words text-slate-600">
                                    {r.summary && (
                                        <div className="text-xs mb-1">
                                            <span className="font-medium">Summary:</span> {r.summary}
                                        </div>
                                    )}
                                    {r.payload != null ? (
                                        <pre className="whitespace-pre-wrap text-xs">
                                            {safeStringify(r.payload)}
                                        </pre>
                                    ) : (
                                        r.summary ? null : "—"
                                    )}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-3 py-6 text-center text-slate-500"
                                >
                                    No audit log entries found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/**
 * JSON.stringify that won't throw on circular values and prints nicely.
 */
function safeStringify(value: unknown): string {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        try {
            // Fallback for unexpected structures
            return String(value);
        } catch {
            return "[unserializable]";
        }
    }
}