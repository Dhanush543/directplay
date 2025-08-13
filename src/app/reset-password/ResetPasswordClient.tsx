"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export default function ResetPasswordClient() {
    const [email, setEmail] = useState("");
    const [touched, setTouched] = useState(false);
    const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

    const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    const emailError =
        touched && (email.trim() === "" ? "Email is required." : !isEmail(email) ? "Enter a valid email." : "");

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTouched(true);
        if (emailError) return;

        try {
            setStatus("loading");
            track?.("reset_submit", { source: "reset_password_page" });
            // Demo only
            await new Promise((r) => setTimeout(r, 600));
            setStatus("ok");
        } catch {
            setStatus("err");
        }
    }

    return (
        <form onSubmit={onSubmit} className="mt-6 max-w-md space-y-3" noValidate>
            <label className="block text-sm font-medium text-slate-700" htmlFor="reset-email">
                Email
            </label>
            <input
                id="reset-email"
                type="email"
                className={[
                    "w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                    emailError ? "border-red-400" : "border-slate-300",
                ].join(" ")}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "reset-email-error" : undefined}
            />
            {emailError ? (
                <p id="reset-email-error" className="text-sm text-red-600">
                    {emailError}
                </p>
            ) : null}

            <button
                type="submit"
                disabled={status === "loading"}
                className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-white hover:bg-slate-800 disabled:opacity-50"
            >
                {status === "loading" ? "Sending…" : "Send reset link"}
            </button>

            {status === "ok" && (
                <p className="text-sm text-emerald-600">If that email exists, we’ve sent a reset link.</p>
            )}
            {status === "err" && (
                <p className="text-sm text-red-600">Couldn’t send the email. Please try again.</p>
            )}
        </form>
    );
}