// src/app/admin/settings/page.tsx
import { requireAdminOrNotFound } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Settings (read-only snapshot)
 * We surface current configuration pulled from environment variables so admins can verify
 * the deployment is wired correctly. Persisted app-level settings (site title, OG image, etc.)
 * can be added later via a DB-backed Settings model if needed.
 */

type Row = { key: string; value: string | null; hint?: string };

function mask(val: string | null | undefined, showTail = 4): string {
    if (!val) return "—";
    const trimmed = String(val);
    if (trimmed.length <= showTail) return "••••";
    return "••••••••••" + trimmed.slice(-showTail);
}

function yesNo(val: unknown): string {
    return val ? "Yes" : "No";
}

export default async function AdminSettingsPage() {
    await requireAdminOrNotFound();

    // Site
    const siteRows: Row[] = [
        { key: "NEXT_PUBLIC_SITE_NAME", value: process.env.NEXT_PUBLIC_SITE_NAME ?? null, hint: "Used in headers, emails, titles." },
        { key: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL ?? null, hint: "Canonical base URL (https://…)." },
        { key: "NEXT_PUBLIC_OG_IMAGE", value: process.env.NEXT_PUBLIC_OG_IMAGE ?? null, hint: "Default Open Graph image path/url." },
    ];

    // Email / Auth
    const emailRows: Row[] = [
        { key: "RESEND_API_KEY", value: mask(process.env.RESEND_API_KEY) },
        { key: "RESEND_FROM", value: process.env.RESEND_FROM ?? null },
        { key: "ADMIN_EMAILS", value: (process.env.ADMIN_EMAILS ?? "").split(",").map(s => s.trim()).filter(Boolean).join(", ") || null, hint: "Comma-separated allowlist for admin access." },
        { key: "AUTH_SECRET / NEXTAUTH_SECRET", value: mask(process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET) },
    ];

    // Storage (S3/R2/GCS via S3-compatible)
    const storageRows: Row[] = [
        { key: "S3_ACCESS_KEY_ID", value: mask(process.env.S3_ACCESS_KEY_ID) },
        { key: "S3_SECRET_ACCESS_KEY", value: mask(process.env.S3_SECRET_ACCESS_KEY) },
        { key: "S3_REGION", value: process.env.S3_REGION ?? null },
        { key: "S3_BUCKET", value: process.env.S3_BUCKET ?? null },
        { key: "S3_PUBLIC_BASE_URL", value: process.env.S3_PUBLIC_BASE_URL ?? null, hint: "Public CDN/base URL (optional)." },
    ];

    // Security (optional)
    const securityRows: Row[] = [
        { key: "IP_ALLOWLIST", value: process.env.IP_ALLOWLIST ?? null, hint: "Comma-separated IPs (enable check in middleware if used)." },
        { key: "NODE_ENV", value: process.env.NODE_ENV ?? null },
    ];

    const dbRows: Row[] = [
        { key: "DATABASE_URL", value: mask(process.env.DATABASE_URL) },
        { key: "DIRECT_URL", value: mask(process.env.DIRECT_URL) },
        { key: "SHADOW_DATABASE_URL", value: mask(process.env.SHADOW_DATABASE_URL) },
    ];

    return (
        <div className="space-y-6">
            <header className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h1 className="text-xl font-semibold">Settings</h1>
                <p className="mt-1 text-sm text-slate-600">
                    Read-only snapshot of your deployment configuration. Update these via your environment (.env / hosting provider).
                </p>
            </header>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Site</h2>
                <SettingsTable rows={siteRows} />
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Email & Auth</h2>
                <SettingsTable rows={emailRows} />
                <div className="mt-3 text-sm text-slate-600">
                    Email login via Resend is <span className="font-medium">{yesNo(!!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM)}</span>.
                </div>
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Database</h2>
                <SettingsTable rows={dbRows} />
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Storage</h2>
                <SettingsTable rows={storageRows} />
                <div className="mt-3 text-sm text-slate-600">
                    Storage configured:{" "}
                    <span className="font-medium">
                        {yesNo(
                            !!process.env.S3_ACCESS_KEY_ID &&
                            !!process.env.S3_SECRET_ACCESS_KEY &&
                            !!process.env.S3_REGION &&
                            !!process.env.S3_BUCKET
                        )}
                    </span>
                </div>
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Security</h2>
                <SettingsTable rows={securityRows} />
                <p className="mt-3 text-sm text-slate-600">
                    Admin RBAC is enforced server-side. Admin routes are noindexed by middleware. Optional IP allowlist is supported via{" "}
                    <code className="rounded bg-slate-100 px-1 py-0.5">IP_ALLOWLIST</code> (implement the check in middleware if you enable it).
                </p>
            </section>

            <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 shadow-sm">
                <h2 className="font-semibold">Next steps</h2>
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700 space-y-1">
                    <li>
                        If you want editable site settings (title, OG image, etc.), add a DB-backed <code className="rounded bg-slate-100 px-1 py-0.5">Settings</code> model
                        and expose server actions here. We kept this page read-only to avoid introducing new schema without your approval.
                    </li>
                    <li>
                        For stronger admin hardening, consider enabling IP allowlist and 2FA for admin accounts.
                    </li>
                </ul>
            </section>
        </div>
    );
}

/* --------------------------- components --------------------------- */

function SettingsTable({ rows }: { rows: Row[] }) {
    return (
        <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="text-left text-slate-500">
                        <th className="px-3 py-2">Key</th>
                        <th className="px-3 py-2">Value</th>
                        <th className="px-3 py-2">Hint</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r: Row) => (
                        <tr key={r.key} className="border-t border-slate-200">
                            <td className="px-3 py-2 font-medium">{r.key}</td>
                            <td className="px-3 py-2">{r.value ? <code className="break-all">{r.value}</code> : <span className="text-slate-400">Not set</span>}</td>
                            <td className="px-3 py-2 text-slate-500">{r.hint ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}