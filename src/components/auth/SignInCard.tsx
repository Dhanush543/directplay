// src/components/auth/SignInCard.tsx
"use client";

import { useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { LogIn } from "lucide-react";
import { track } from "@/lib/analytics";

function isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function SignInCard({ onSwitch }: { onSwitch: () => void }) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendOk, setResendOk] = useState<null | boolean>(null);
    const [err, setErr] = useState<string | null>(null);

    // Validation gating so fields don't error on first paint
    const [touched, setTouched] = useState(false);
    const [didSubmit, setDidSubmit] = useState(false);

    const emailId = "signin-email";
    const liveId = "signin-live";

    const rawError = useMemo(() => {
        if (!email) return "Email is required.";
        if (!isEmail(email)) return "Enter a valid email.";
        return null;
    }, [email]);
    const showError = (touched || didSubmit) ? rawError : null;

    async function doSend() {
        setErr(null);
        setResendOk(null);

        const res = await signIn("email", {
            email,
            redirect: false,         // stay on page to show the confirmation
            callbackUrl: "/dashboard" // <- post-login redirect target
        });

        return res?.ok ?? false;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setDidSubmit(true);
        if (rawError) return;

        setLoading(true);
        track("auth_signin_attempt", { method: "email" });

        const ok = await doSend();
        setLoading(false);

        if (ok) {
            setSent(true);
            const live = document.getElementById(liveId);
            if (live) live.textContent = "Sign-in link sent.";
        } else {
            setErr("Could not send sign-in link. Please try again.");
        }
    }

    async function onResend() {
        if (!email || !isEmail(email)) return;
        setResending(true);
        setResendOk(null);
        const ok = await doSend();
        setResending(false);
        setResendOk(ok);
    }

    if (sent) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <LogIn className="h-5 w-5 text-indigo-600" aria-hidden />
                    <h2 className="text-xl font-bold">Check your email</h2>
                </div>
                <p className="text-sm text-slate-600">
                    We sent a secure sign-in link to <b>{email}</b>. The link expires in 10 minutes.
                </p>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onResend}
                        disabled={resending}
                        className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3.5 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                        {resending ? "Resending…" : "Resend link"}
                    </button>
                    <button
                        onClick={() => { setSent(false); setDidSubmit(false); setTouched(false); }}
                        className="text-sm text-indigo-600 hover:underline"
                    >
                        Use a different email
                    </button>
                </div>

                {resendOk === true && (
                    <p className="text-xs text-emerald-600">A new sign-in link was sent.</p>
                )}
                {resendOk === false && (
                    <p className="text-xs text-red-600">Couldn’t resend. Please try again.</p>
                )}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col">
            <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-indigo-600" aria-hidden />
                <h2 className="text-xl font-bold">Sign in</h2>
            </div>
            <p className="mt-1 text-slate-600">Welcome back! Use your email to receive a magic link.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                <div>
                    <label htmlFor={emailId} className="block text-sm font-medium text-slate-700">
                        Email
                    </label>
                    <input
                        id={emailId}
                        className={[
                            "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                            showError ? "border-red-400" : "border-slate-300",
                        ].join(" ")}
                        placeholder="you@example.com"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched(true)}
                        aria-invalid={!!showError}
                    />
                    {showError && <p className="mt-1 text-sm text-red-600">{showError}</p>}
                </div>

                <button
                    type="submit"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "Sending…" : "Send sign-in link"}
                </button>

                <p className="text-sm text-slate-600 text-center">
                    Don’t have an account{" "}
                    <button
                        type="button"
                        onClick={onSwitch}
                        className="font-medium text-indigo-600 hover:underline"
                    >
                        Create one
                    </button>
                </p>

                <p id={liveId} className="sr-only" aria-live="polite" />
                {err && <p className="text-sm text-red-600">{err}</p>}
            </form>
        </div>
    );
}