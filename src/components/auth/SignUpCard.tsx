// src/components/auth/SignUpCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, UserPlus, Check } from "lucide-react";
import { track } from "@/lib/analytics";

type FieldKey = "name" | "email" | "pwd" | "terms";

function isEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function scorePassword(pw: string) {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
    if (/\d/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return Math.max(0, Math.min(4, s));
}
function strengthLabel(s: number) {
    return ["Very weak", "Weak", "Okay", "Good", "Strong"][s] || "Weak";
}
function strengthColor(s: number) {
    return ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-green-600"][s];
}

export default function SignUpCard({ onSwitch }: { onSwitch: () => void }) {
    const [showPwd, setShowPwd] = useState(false);
    const [agree, setAgree] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState<null | "ok" | "err">(null);

    const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
    const [didSubmit, setDidSubmit] = useState(false);

    const errors: Record<FieldKey, string | null> = useMemo(() => {
        return {
            name: name.trim() ? null : "Full name is required.",
            email: !email ? "Email is required." : !isEmail(email) ? "Enter a valid email." : null,
            pwd: !pwd ? "Password is required." : pwd.length < 8 ? "Use at least 8 characters." : null,
            terms: agree ? null : "You must accept the Terms & Privacy.",
        };
    }, [name, email, pwd, agree]);

    const showErr = (key: FieldKey) => (touched[key] || didSubmit) && !!errors[key];

    const pwScore = scorePassword(pwd);
    const pwPct = (pwScore / 4) * 100;
    const canSubmit = !errors.name && !errors.email && !errors.pwd && !errors.terms;

    function welcomeTemplate(nm: string) {
        return `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.5;">
        <h2>Welcome to <span style="color:#4f46e5">DirectPlay</span>${nm ? `, ${nm}` : ""} 🎉</h2>
        <p>Thanks for signing up. You now have access to lessons, notes, and job-ready projects.</p>
        <p>Get started here: <a href="https://directplay.in" target="_blank">directplay.in</a></p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
        <p style="font-size:12px;color:#6b7280">You’re getting this because you created an account on DirectPlay.</p>
      </div>
    `;
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setDidSubmit(true);
        setTouched({ name: true, email: true, pwd: true, terms: true });

        if (!canSubmit) {
            const form = e.currentTarget;
            if (errors.name) form.querySelector<HTMLInputElement>("input[name='name']")?.focus();
            else if (errors.email) form.querySelector<HTMLInputElement>("input[name='email']")?.focus();
            else if (errors.pwd) form.querySelector<HTMLInputElement>("input[name='password']")?.focus();
            return;
        }

        setLoading(true);
        setSent(null);
        track("auth_signup_attempt", { valid: true, pwScore });

        try {
            await new Promise((r) => setTimeout(r, 500));
            const res = await fetch("/api/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to: email,
                    subject: "Welcome to DirectPlay 🚀",
                    html: welcomeTemplate(name),
                }),
            });

            if (res.ok) {
                setSent("ok");
                track("email_welcome_sent", { to: "self" });
            } else {
                setSent("err");
            }

            window.location.assign("/?signup=1");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex w-full flex-col">
            <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" aria-hidden />
                <h2 className="text-xl font-bold">Create account</h2>
            </div>
            <p className="mt-1 text-slate-600">Join DirectPlay and start learning.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-slate-700">Full name</label>
                    <input
                        name="name"
                        className={[
                            "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                            showErr("name") ? "border-red-400" : "border-slate-300",
                        ].join(" ")}
                        placeholder="Alex Johnson"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        aria-invalid={showErr("name")}
                    />
                    {showErr("name") && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                        name="email"
                        className={[
                            "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                            showErr("email") ? "border-red-400" : "border-slate-300",
                        ].join(" ")}
                        placeholder="you@example.com"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        aria-invalid={showErr("email")}
                    />
                    {showErr("email") && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                    <label className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative mt-1">
                        <input
                            name="password"
                            className={[
                                "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                                showErr("pwd") ? "border-red-400" : "border-slate-300",
                            ].join(" ")}
                            placeholder="Create a password"
                            type={showPwd ? "text" : "password"}
                            autoComplete="new-password"
                            value={pwd}
                            onChange={(e) => setPwd(e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, pwd: true }))}
                            aria-invalid={showErr("pwd")}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPwd((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            aria-label={showPwd ? "Hide password" : "Show password"}
                        >
                            {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Strength meter */}
                    {pwd && (
                        <div className="mt-2" aria-live="polite">
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                                <div
                                    className={`h-full transition-all ${strengthColor(pwScore)}`}
                                    style={{ width: `${pwPct}%` }}
                                />
                            </div>
                            <div className="mt-1 text-xs text-slate-600">Strength: {strengthLabel(pwScore)}</div>
                        </div>
                    )}

                    {showErr("pwd") && <p className="mt-1 text-sm text-red-600">{errors.pwd}</p>}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-2 text-sm text-slate-600">
                    <input
                        type="checkbox"
                        className="mt-1"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        onBlur={() => setTouched((t) => ({ ...t, terms: true }))}
                        aria-invalid={showErr("terms")}
                    />
                    <span>
                        I agree to the <a className="text-indigo-600 hover:underline">Terms</a> and{" "}
                        <a className="text-indigo-600 hover:underline">Privacy Policy</a>.
                    </span>
                </label>
                {showErr("terms") && <p className="text-sm text-red-600">{errors.terms}</p>}

                {/* Submit */}
                <button
                    type="submit"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"
                    disabled={loading}
                >
                    {loading ? "Creating…" : "Create account"}
                </button>

                {/* email send status */}
                {sent === "ok" && (
                    <div className="text-xs mt-1 text-emerald-600 flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> Welcome email sent.
                    </div>
                )}
                {sent === "err" && (
                    <div className="text-xs mt-1 text-amber-600">
                        Couldn’t send welcome email, but signup continued.
                    </div>
                )}

                {/* switch */}
                <p className="text-sm text-slate-600 text-center">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={onSwitch}
                        className="font-medium text-indigo-600 hover:underline"
                        aria-label="Go to sign in"
                    >
                        Sign in
                    </button>
                </p>
            </form>
        </div>
    );
}