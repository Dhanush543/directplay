// src/app/admin/tools/stream/page.tsx
import { requireAdminOrNotFound } from "@/lib/auth";
import NextDynamic from "next/dynamic";

const StreamCostEstimator = NextDynamic(
    () => import("@/components/admin/StreamCostEstimator"),
    { ssr: false }
);

export const dynamic = "force-dynamic";

export default async function StreamToolsPage() {
    await requireAdminOrNotFound();
    const fx = Number(process.env.USD_TO_INR || "83");

    return (
        <main className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl font-bold">Streaming tools</h1>
            <p className="mt-1 text-sm text-slate-600">
                Cloudflare Stream integration helpers &amp; cost estimator.
            </p>

            <div className="mt-6">
                <StreamCostEstimator usdToInrDefault={fx} />
            </div>
        </main>
    );
}