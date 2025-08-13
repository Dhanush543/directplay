// src/components/auth/SignUpCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, UserPlus, X } from "lucide-react";
import { track } from "@/lib/analytics";
import { legalContent } from "@/lib/siteContent";

/* ---------- helpers ---------- */
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

/* ---------- component ---------- */
export default function SignUpCard({ onSwitch }: { onSwitch: () => void }) {
    const [show, setShow] = useState(false);
    const [agree, setAgree] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");

    const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; pw?: boolean; terms?: boolean }>({});
    const [openPolicy, setOpenPolicy] = useState(false);

    // Lock page scroll when modal is open
    useEffect(() => {
        if (!openPolicy) return;
        const prevHtml = document.documentElement.style.overflow;
        const prevBody = document.body.style.overflow;
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        return () => {
            document.documentElement.style.overflow = prevHtml;
            document.body.style.overflow = prevBody;
        };
    }, [openPolicy]);

    // Close on ESC (global listener so it works regardless of focus)
    useEffect(() => {
        if (!openPolicy) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenPolicy(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [openPolicy]);

    // ids
    const formTitleId = "signup-title";
    const nameId = "signup-name";
    const emailId = "signup-email";
    const pwId = "signup-password";
    const pwHintId = "signup-password-hint";
    const termsId = "signup-terms";
    const termsDescId = "signup-terms-desc";
    const termsErrorId = "signup-terms-error";
    const liveStatusId = "signup-live";

    // validation
    const errors = useMemo(() => {
        const e: Record<string, string | null> = {};
        e.name = name.trim() ? null : "Full name is required.";
        e.email = !email ? "Email is required." : !isEmail(email) ? "Enter a valid email." : null;
        e.pw = !pw ? "Password is required." : pw.length < 8 ? "Use at least 8 characters." : null;
        e.terms = agree ? null : "You must accept the Terms & Privacy to continue.";
        return e;
    }, [name, email, pw, agree]);

    const fieldsValid = !errors.name && !errors.email && !errors.pw;
    const canSubmit = fieldsValid && agree;

    const pwScore = scorePassword(pw);
    const pwPct = (pwScore / 4) * 100;

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setTouched({ name: true, email: true, pw: true, terms: true });

        if (!canSubmit) {
            if (errors.name) document.getElementById(nameId)?.focus();
            else if (errors.email) document.getElementById(emailId)?.focus();
            else if (errors.pw) document.getElementById(pwId)?.focus();
            else if (errors.terms) document.getElementById(termsId)?.focus();

            const live = document.getElementById(liveStatusId);
            if (live) live.textContent = "Please fix the highlighted errors.";
            track?.("auth_signup_attempt", { valid: false });
            return;
        }

        track?.("auth_signup_attempt", { valid: true, pwScore });
        const live = document.getElementById(liveStatusId);
        if (live) live.textContent = "Submitting sign-up…";
        alert("Demo only: Sign-up UI submitted.");
    }

    return (
        <div className="flex w-full flex-col" aria-labelledby={formTitleId}>
            <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <h2 id={formTitleId} className="text-xl font-bold">Create account</h2>
            </div>
            <p className="mt-1 text-slate-600">Join DirectPlay and start learning.</p>

            {/* Google button */}
            <button
                onClick={() => {
                    track?.("auth_google_click", { action: "signup" });
                    alert("Demo only: Google sign-up");
                }}
                type="button"
                className={[
                    "mt-5 inline-flex h-11 w-full items-center justify-center gap-3 rounded-full",
                    "bg-white text-slate-800 font-medium shadow-sm ring-1 ring-slate-200",
                    "hover:ring-slate-300 hover:shadow transition",
                ].join(" ")}
                aria-label="Continue with Google (demo)"
            >
                <span aria-hidden className="inline-flex">
                    <svg width="18" height="18" viewBox="0 0 48 48" role="img" aria-label="Google">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36 16.8 36 11 30.2 11 23s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34 4.7 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34 4.7 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.6-5.2l-6.3-5.2C29.3 36.3 26.8 37 24 37c-5.3 0-9.8-3.1-11.7-7.6l-6.7 5.2C9 40.4 15.9 45 24 45z" />
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.8-4.9 6.5-9.3 6.5-5.3 0-9.8-3.1-11.7-7.6l-6.7 5.2C9 40.4 15.9 45 24 45c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z" />
                    </svg>
                </span>
                Continue with Google
            </button>

            <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
                {/* name */}
                <div>
                    <label htmlFor={nameId} className="block text-sm font-medium text-slate-700">Full name</label>
                    <input
                        id={nameId}
                        name="name"
                        className={[
                            "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                            touched.name && errors.name ? "border-red-400" : "border-slate-300",
                        ].join(" ")}
                        placeholder="Alex Johnson"
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                        aria-invalid={touched.name && !!errors.name}
                        aria-describedby={touched.name && errors.name ? `${nameId}-error` : undefined}
                        required
                    />
                    {touched.name && errors.name && (
                        <p id={`${nameId}-error`} className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                </div>

                {/* email */}
                <div>
                    <label htmlFor={emailId} className="block text-sm font-medium text-slate-700">Email</label>
                    <input
                        id={emailId}
                        name="email"
                        className={[
                            "mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                            touched.email && errors.email ? "border-red-400" : "border-slate-300",
                        ].join(" ")}
                        placeholder="you@example.com"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        aria-invalid={touched.email && !!errors.email}
                        aria-describedby={touched.email && errors.email ? `${emailId}-error` : undefined}
                        required
                    />
                    {touched.email && errors.email && (
                        <p id={`${emailId}-error`} className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                </div>

                {/* password */}
                <div>
                    <label htmlFor={pwId} className="block text-sm font-medium text-slate-700">Password</label>
                    <div className="relative mt-1">
                        <input
                            id={pwId}
                            name="password"
                            className={[
                                "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                                touched.pw && errors.pw ? "border-red-400" : "border-slate-300",
                            ].join(" ")}
                            placeholder="Create a password"
                            type={show ? "text" : "password"}
                            autoComplete="new-password"
                            aria-describedby={`${pwHintId} ${pw ? pwId + "-strength" : ""} ${touched.pw && errors.pw ? pwId + "-error" : ""}`}
                            aria-invalid={touched.pw && !!errors.pw}
                            value={pw}
                            onChange={(e) => setPw(e.target.value)}
                            onBlur={() => setTouched((t) => ({ ...t, pw: true }))}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShow((s) => !s)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                            aria-label={show ? "Hide password" : "Show password"}
                            aria-pressed={show}
                            aria-controls={pwId}
                        >
                            {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                        </button>
                    </div>
                    <p id={pwHintId} className="sr-only">
                        Use at least 8 characters; numbers, symbols and mixed case improve strength.
                    </p>

                    {/* strength meter – shown only when user types */}
                    {pw && (
                        <div className="mt-2" aria-live="polite">
                            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                                <div className={`h-full transition-all ${strengthColor(pwScore)}`} style={{ width: `${pwPct}%` }} />
                            </div>
                            <div id={`${pwId}-strength`} className="mt-1 text-xs text-slate-600">
                                Strength: {strengthLabel(pwScore)}
                            </div>
                        </div>
                    )}

                    {touched.pw && errors.pw && (
                        <p id={`${pwId}-error`} className="mt-1 text-sm text-red-600">{errors.pw}</p>
                    )}
                </div>

                {/* terms row with single modal link */}
                <div
                    className={[
                        "mt-1 flex items-start gap-2 rounded-md p-1",
                        touched.terms && errors.terms ? "ring-1 ring-red-300 bg-red-50/40" : "",
                    ].join(" ")}
                >
                    <input
                        id={termsId}
                        type="checkbox"
                        className="mt-1"
                        checked={agree}
                        onChange={(e) => setAgree(e.target.checked)}
                        onBlur={() => setTouched((t) => ({ ...t, terms: true }))}
                        aria-invalid={touched.terms && !!errors.terms}
                        aria-describedby={`${termsDescId} ${touched.terms && errors.terms ? termsErrorId : ""}`}
                        required
                    />
                    <label htmlFor={termsId} className="select-none text-sm text-slate-600">
                        I agree to the{" "}
                        <button
                            type="button"
                            onClick={() => setOpenPolicy(true)}
                            className="text-indigo-600 hover:underline underline-offset-2"
                            aria-label="Open Terms & Privacy in a dialog"
                        >
                            Terms & Privacy
                        </button>.
                    </label>
                </div>
                <p id={termsDescId} className="sr-only">You must accept the Terms & Privacy Policy to create an account.</p>
                {touched.terms && errors.terms && (
                    <p id={termsErrorId} className="mt-1 text-sm text-red-600" role="alert">
                        {errors.terms}
                    </p>
                )}

                <button
                    type="submit"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-50"
                    disabled={!canSubmit}
                >
                    Create account
                </button>

                <p className="text-sm text-slate-600 text-center">
                    Already have an account{" "}
                    <button
                        type="button"
                        onClick={onSwitch}
                        className="font-medium text-indigo-600 hover:underline"
                        aria-label="Go to sign in"
                    >
                        Sign in
                    </button>
                </p>

                {/* Live region for form status */}
                <p id={liveStatusId} className="sr-only" aria-live="polite" />
            </form>

            {/* ---- Modal: combined Terms & Privacy ---- */}
            {openPolicy && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="policy-title"
                    className="fixed inset-0 z-50"
                >
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setOpenPolicy(false)}
                        aria-hidden="true"
                    />
                    <div className="absolute inset-0 grid place-items-center p-4">
                        <div className="w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/10 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
                                <h3 id="policy-title" className="text-sm font-semibold text-slate-900">Terms & Privacy</h3>
                                <button
                                    type="button"
                                    onClick={() => setOpenPolicy(false)}
                                    className="rounded-md p-1 hover:bg-slate-100"
                                    aria-label="Close dialog"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="px-5 py-4 overflow-y-auto overscroll-contain flex-1">
                                <article className="prose prose-slate max-w-none">
                                    <p className="text-sm text-slate-500">You’re agreeing to both documents below.</p>

                                    {/* Terms */}
                                    <section className="mt-4">
                                        <h4 className="font-semibold text-slate-900">Terms of Service</h4>
                                        <p className="text-xs text-slate-500">Last updated: {legalContent.terms.updatedOn}</p>
                                        {legalContent.terms.sections.map((sec) => (
                                            <div key={`t-${sec.heading}`} className="mt-3">
                                                <div className="font-medium">{sec.heading}</div>
                                                {"body" in sec && sec.body?.map((p) => <p key={p} className="mt-1 text-sm">{p}</p>)}
                                                {"list" in sec && sec.list?.length ? (
                                                    <ul className="mt-1 list-disc pl-5 text-sm">
                                                        {sec.list.map((li) => <li key={li}>{li}</li>)}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        ))}
                                    </section>

                                    {/* Privacy */}
                                    <section className="mt-6">
                                        <h4 className="font-semibold text-slate-900">Privacy Policy</h4>
                                        <p className="text-xs text-slate-500">Last updated: {legalContent.privacy.updatedOn}</p>
                                        {legalContent.privacy.sections.map((sec) => (
                                            <div key={`p-${sec.heading}`} className="mt-3">
                                                <div className="font-medium">{sec.heading}</div>
                                                {"body" in sec && sec.body?.map((p) => <p key={p} className="mt-1 text-sm">{p}</p>)}
                                                {"list" in sec && sec.list?.length ? (
                                                    <ul className="mt-1 list-disc pl-5 text-sm">
                                                        {sec.list.map((li) => <li key={li}>{li}</li>)}
                                                    </ul>
                                                ) : null}
                                            </div>
                                        ))}
                                    </section>
                                </article>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setAgree(true);
                                        setTouched((t) => ({ ...t, terms: true }));
                                        setOpenPolicy(false);
                                        setTimeout(() => document.getElementById(termsId)?.focus(), 0);
                                    }}
                                    className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                >
                                    I Agree
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setOpenPolicy(false)}
                                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}