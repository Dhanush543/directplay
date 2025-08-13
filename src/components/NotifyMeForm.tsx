// src/components/NotifyMeForm.tsx
"use client";

import { useMemo, useRef, useState } from "react";
import { track } from "@/lib/analytics";

export default function NotifyMeForm({
    formAction,
    mailto = "hello@directplay.in",
}: {
    formAction?: string; // e.g. Formspree/Mailchimp endpoint
    mailto?: string;
}) {
    const [email, setEmail] = useState("");
    const [status, setStatus] =
        useState<"idle" | "loading" | "ok" | "err">("idle");
    const [touched, setTouched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const emailId = "careers-notify-email";
    const errorId = "careers-notify-error";

    function isEmail(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }

    const errorMsg = useMemo(() => {
        if (!touched) return null;
        if (!email.trim()) return "Email is required.";
        if (!isEmail(email)) return "Please enter a valid email.";
        return null;
    }, [email, touched]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setTouched(true);

        // Block when invalid
        if (!email.trim() || !isEmail(email)) {
            track?.("career_notify_submit", { site: "directplay", valid: false });
            // focus input so it's obvious
            inputRef.current?.focus();
            return;
        }

        track?.("career_notify_submit", { site: "directplay", valid: true });

        // No backend: open mail draft as a fallback
        if (!formAction) {
            window.location.href = `mailto:${mailto}?subject=${encodeURIComponent(
                "Notify me about job openings"
            )}&body=${encodeURIComponent(
                `Please notify me when roles open.\n\nEmail: ${email}`
            )}`;
            setStatus("ok");
            setEmail("");
            setTouched(false);
            return;
        }

        try {
            setStatus("loading");
            const res = await fetch(formAction, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setStatus("ok");
            setEmail("");
            setTouched(false);
        } catch {
            setStatus("err");
        } finally {
            setStatus((s) => (s === "loading" ? "idle" : s));
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3"
            noValidate
        >
            {/* Input + inline error stacked vertically */}
            <div className="w-full sm:w-80">
                <input
                    ref={inputRef}
                    id={emailId}
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                        // clear “touched” error once the user starts editing after first blur
                        if (!touched) setTouched(false);
                    }}
                    onBlur={() => setTouched(true)}
                    placeholder="you@example.com"
                    className={[
                        "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                        touched && errorMsg ? "border-red-400" : "border-slate-300",
                    ].join(" ")}
                    aria-label="Email address"
                    aria-invalid={!!(touched && errorMsg)}
                    aria-describedby={touched && errorMsg ? errorId : undefined}
                    autoComplete="email"
                    inputMode="email"
                />
                {touched && errorMsg && (
                    <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
                        {errorMsg}
                    </p>
                )}
                {status === "ok" && !errorMsg && (
                    <p className="mt-1 text-sm text-emerald-600">
                        Got it — we’ll let you know!
                    </p>
                )}
                {status === "err" && (
                    <p className="mt-1 text-sm text-red-600" role="alert">
                        Could not submit. Please try again later.
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={status === "loading"}
                className="h-10 rounded-lg bg-slate-900 px-4 text-sm text-white hover:bg-slate-800 disabled:opacity-50"
            >
                {status === "loading" ? "Submitting…" : "Notify me"}
            </button>
        </form>
    );
}