"use client";

import * as React from "react";

/** Stable Indian number formatter for the client */
const useNumberFormatter = () =>
    React.useMemo(() => new Intl.NumberFormat("en-IN"), []);

function toNum(v: string, d = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
}

export default function StreamCostEstimator({
    usdToInrDefault = 83,
    priceInrDefault = 200,
}: {
    usdToInrDefault?: number;
    priceInrDefault?: number;
}) {
    // Demand-side
    const [students, setStudents] = React.useState("1000");
    const [courseMin, setCourseMin] = React.useState("100");
    const [rewatches, setRewatches] = React.useState("1"); // extra full views per student
    const [priceInr, setPriceInr] = React.useState(String(priceInrDefault));

    // FX
    const [usdToInr, setUsdToInr] = React.useState(String(usdToInrDefault));

    // Platform fixed costs (monthly, INR)
    const [vercelInr, setVercelInr] = React.useState("0");
    const [dbInr, setDbInr] = React.useState("0"); // Neon / Supabase / PlanetScale etc.
    const [resendInr, setResendInr] = React.useState("0"); // Email (Resend)
    const [otherInr, setOtherInr] = React.useState("0"); // Any other fixed cost
    const [coursesSharing, setCoursesSharing] = React.useState("1"); // how many courses share fixed costs

    // Parse
    const s = toNum(students, 0);
    const m = toNum(courseMin, 0);
    const r = toNum(rewatches, 0);
    const fx = toNum(usdToInr, usdToInrDefault);
    const price = toNum(priceInr, priceInrDefault);

    const nf = useNumberFormatter();
    const fmt = (n: number) => nf.format(n);

    /* ---------------- Cloudflare Stream costs ----------------
       Pricing (assumed):
         - $5 / 1000 stored‑minutes
         - $1 / 1000 delivered‑minutes (watch minutes)
    ---------------------------------------------------------- */
    const storedMin = m;
    const deliveredMin = m * s * (1 + r);

    const streamCostUSD = (storedMin / 1000) * 5 + (deliveredMin / 1000) * 1;
    const streamCostINR = streamCostUSD * fx;

    /* ---------------- Platform fixed costs (monthly) ---------------- */
    const fixedMonthlyINR =
        toNum(vercelInr, 0) + toNum(dbInr, 0) + toNum(resendInr, 0) + toNum(otherInr, 0);

    const sharing = Math.max(1, toNum(coursesSharing, 1));
    const perCourseShareINR = fixedMonthlyINR / sharing;

    /* ---------------- Totals & Revenue ---------------- */
    const totalCostINR = streamCostINR + perCourseShareINR;
    const revenueINR = s * price;
    const profitINR = revenueINR - totalCostINR;
    const isProfit = profitINR >= 0;

    const perStudentINR = s > 0 ? totalCostINR / s : 0;
    const breakevenStudents = price > 0 ? Math.ceil(totalCostINR / price) : 0;

    return (
        <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
            {/* Profit/Loss badge */}
            <div className="absolute right-4 top-4">
                <span
                    className={
                        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold " +
                        (isProfit
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-rose-100 text-rose-700 ring-1 ring-rose-200")
                    }
                    title={isProfit ? "You are in profit" : "You are in loss"}
                >
                    {isProfit ? "✅ Profit" : "❌ Loss"}{" "}
                    <span>₹{fmt(Math.round(Math.abs(profitINR)))}</span>
                </span>
            </div>

            <div className="font-semibold">Course cost &amp; profit estimator</div>

            {/* Basic inputs */}
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Students</div>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        value={students}
                        onChange={(e) => setStudents(e.target.value)}
                        inputMode="numeric"
                    />
                </label>
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Course length (minutes)</div>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        value={courseMin}
                        onChange={(e) => setCourseMin(e.target.value)}
                        inputMode="numeric"
                    />
                </label>
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Extra full rewatches / student</div>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        value={rewatches}
                        onChange={(e) => setRewatches(e.target.value)}
                        inputMode="numeric"
                    />
                </label>
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">USD → INR</div>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        value={usdToInr}
                        onChange={(e) => setUsdToInr(e.target.value)}
                        inputMode="decimal"
                    />
                </label>
                <label className="text-sm">
                    <div className="mb-1 text-slate-600">Price per student (INR)</div>
                    <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                        value={priceInr}
                        onChange={(e) => setPriceInr(e.target.value)}
                        inputMode="numeric"
                    />
                </label>
            </div>

            {/* Fixed platform costs */}
            <div className="mt-5 rounded-xl border border-slate-200 p-3">
                <div className="text-sm font-medium">Platform fixed costs (monthly, INR)</div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Vercel (hosting)</div>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            value={vercelInr}
                            onChange={(e) => setVercelInr(e.target.value)}
                            inputMode="numeric"
                            placeholder="e.g. 1600"
                        />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Database (Neon / Supabase)</div>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            value={dbInr}
                            onChange={(e) => setDbInr(e.target.value)}
                            inputMode="numeric"
                            placeholder="e.g. 1200"
                        />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Resend (emails)</div>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            value={resendInr}
                            onChange={(e) => setResendInr(e.target.value)}
                            inputMode="numeric"
                            placeholder="e.g. 800"
                        />
                    </label>
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Other fixed costs</div>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            value={otherInr}
                            onChange={(e) => setOtherInr(e.target.value)}
                            inputMode="numeric"
                            placeholder="e.g. 0"
                        />
                    </label>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-sm">
                        <div className="mb-1 text-slate-600">Courses sharing these costs</div>
                        <input
                            className="w-full rounded-md border border-slate-300 px-3 py-2"
                            value={coursesSharing}
                            onChange={(e) => setCoursesSharing(e.target.value)}
                            inputMode="numeric"
                            placeholder="e.g. number of active courses"
                        />
                    </label>
                    <div className="text-sm rounded-lg bg-slate-50 p-3">
                        <div className="text-xs text-slate-500">Fixed costs</div>
                        <div>
                            Total (monthly): <span className="font-medium">₹{fmt(Math.round(fixedMonthlyINR))}</span>{" "}
                            • Per-course share: <span className="font-medium">₹{fmt(Math.round(perCourseShareINR))}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rollup cards */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Minutes</div>
                    <div className="text-sm">
                        Stored: <span className="font-medium">{fmt(storedMin)}</span> · Delivered:{" "}
                        <span className="font-medium">{fmt(deliveredMin)}</span>
                    </div>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Estimated cost &amp; revenue</div>
                    <div className="text-sm">
                        Stream cost: USD <span className="font-medium">${streamCostUSD.toFixed(2)}</span> · INR{" "}
                        <span className="font-medium">₹{fmt(Math.round(streamCostINR))}</span>
                    </div>
                    <div className="text-sm mt-1">
                        Total cost (incl. platform share):{" "}
                        <span className="font-medium">₹{fmt(Math.round(totalCostINR))}</span> · per student{" "}
                        <span className="font-medium">₹{fmt(Math.ceil(perStudentINR))}</span>
                    </div>
                    <div className="mt-1 text-sm">
                        Revenue: <span className="font-medium">₹{fmt(Math.round(revenueINR))}</span>
                        <span className="ml-2 text-slate-500">(₹{fmt(price)} × {fmt(s)})</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <div className="text-xs text-slate-500">Breakeven</div>
                <div className="text-sm">
                    You need at least{" "}
                    <span className="font-semibold">{fmt(breakevenStudents)} active students</span> to cover the
                    estimated total cost.
                </div>
            </div>

            <p className="mt-2 text-xs text-slate-500">
                Assumes Cloudflare Stream pricing: $5/1000 stored‑min, $1/1000 delivered‑min. Rewatches increase
                delivered minutes. Platform fixed costs are divided by the number of active courses you set above.
            </p>
        </div>
    );
}