//src/components/auth/SignInCard.tsx
"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { track } from "@/lib/analytics";

function isEmail(v: string) {
    // light validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export default function SignInCard({ onSwitch }: { onSwitch: () => void }) {
    const [show, setShow] = useState(false);
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [touched, setTouched] = useState<{ email?: boolean; pw?: boolean }>({});

    // ids for a11y wiring
    const formTitleId = "signin-title";
    const emailId = "signin-email";
    const emailHintId = "signin-email-hint";
    const pwId = "signin-password";
    const pwHintId = "signin-password-hint";
    const liveStatusId = "signin-live";

    const errors = useMemo(() => {
        const e: Record<string, string | null> = {};
        e.email = email.length === 0 ? "Email is required." : !isEmail(email) ? "Enter a valid email." : null;
        e.pw = pw.length === 0 ? "Password is required." : null;
        return e;
    }, [email, pw]);

    const isValid = !errors.email && !errors.pw;

    return (
        <div className="flex w-full flex-col" aria-labelledby={formTitleId}>
            <div className="flex items-center gap-2">
                <LogIn className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                <h2 id={formTitleId} className="text-xl font-bold">
                    Sign in
                </h2>
            </div>
            <p className="mt-1 text-slate-600" id="signin-subtitle">
                Welcome back! Enter your credentials to continue.
            </p>

            {/* Google button — official white style */}
            <button
                onClick={() => {
                    track("auth_google_click", { action: "signin" });
                    alert("Demo only: Google sign-in");
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
                    {/* Google 'G' using brand colors */}
                    <svg width="18" height="18" viewBox="0 0 48 48" role="img" aria-label="Google">
                        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36 16.8 36 11 30.2 11 23s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34 4.7 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16.1 18.9 13 24 13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34 4.7 29.3 3 24 3 16 3 9 7.6 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 45c5.2 0 10-1.9 13.6-5.2l-6.3-5.2C29.3 36.3 26.8 37 24 37c-5.3 0-9.8-3.1-11.7-7.6l-6.7 5.2C9 40.4 15.9 45 24 45z" />
                        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.8-4.9 6.5-9.3 6.5-5.3 0-9.8-3.1-11.7-7.6l-6.7 5.2C9 40.4 15.9 45 24 45c10.5 0 20-7.6 20-21 0-1.2-.1-2.3-.4-3.5z" />
                    </svg>
                </span>
                Continue with Google
            </button>

            <form
                className="mt-6 space-y-4"
                aria-describedby="signin-subtitle"
                onSubmit={(e) => {
                    e.preventDefault();
                    setTouched({ email: true, pw: true });

                    if (!isValid) {
                        const live = document.getElementById(liveStatusId);
                        if (live) live.textContent = "Please fix the highlighted errors.";
                        track("auth_signin_attempt", { valid: false });
                        return;
                    }

                    track("auth_signin_attempt", { valid: true });
                    const live = document.getElementById(liveStatusId);
                    if (live) live.textContent = "Submitting sign-in…";
                    alert("Demo only: Sign-in UI submitted.");
                }}
                noValidate
            >
                <div>
                    <label htmlFor={emailId} className="block text-sm font-medium text-slate-700">
                        Email
                    </label>
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
                        aria-describedby={`${emailHintId} ${touched.email && errors.email ? emailId + "-error" : ""}`}
                        aria-invalid={touched.email && !!errors.email}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        required
                    />
                    <p id={emailHintId} className="sr-only">
                        Enter the email you used for DirectPlay.
                    </p>
                    {touched.email && errors.email && (
                        <p id={`${emailId}-error`} className="mt-1 text-sm text-red-600">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor={pwId} className="block text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id={pwId}
                            name="password"
                            className={[
                                "w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200",
                                touched.pw && errors.pw ? "border-red-400" : "border-slate-300",
                            ].join(" ")}
                            placeholder="Your password"
                            type={show ? "text" : "password"}
                            autoComplete="current-password"
                            aria-describedby={`${pwHintId} ${touched.pw && errors.pw ? pwId + "-error" : ""}`}
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
                        Password is case sensitive.
                    </p>
                    {touched.pw && errors.pw && (
                        <p id={`${pwId}-error`} className="mt-1 text-sm text-red-600">
                            {errors.pw}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-lg bg-slate-900 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:opacity-50"
                    disabled={!isValid}
                >
                    Sign in
                </button>

                <p className="text-sm text-slate-600 text-center">
                    Don’t have an account{" "}
                    <button
                        type="button"
                        onClick={onSwitch}
                        className="font-medium text-indigo-600 hover:underline"
                        aria-label="Create an account"
                    >
                        Create one
                    </button>
                </p>

                {/* Live region for form status (polite, not disruptive) */}
                <p id={liveStatusId} className="sr-only" aria-live="polite" />
            </form>
        </div>
    );
}