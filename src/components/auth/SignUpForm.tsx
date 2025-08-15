// src/components/auth/SignUpForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff, Loader2, Check } from "lucide-react";

/** simple strength scorer: 0..4 */
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

export default function SignUpForm() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState<null | "ok" | "err">(null);
    const [errors, setErrors] = useState<{ name?: string; email?: string; pwd?: string; agree?: string }>({});

    const pwScore = useMemo(() => scorePassword(pwd), [pwd]);
    const pwPct = (pwScore / 4) * 100;

    function validate() {
        const e: typeof errors = {};
        if (!name.trim()) e.name = "Enter your name.";
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email.";
        if (pwd.length < 8) e.pwd = "Password must be at least 8 characters.";
        if (!agree) e.agree = "You must accept the Terms.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    const welcomeTemplate = (n: string) => `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height:1.5;">
      <h2>Welcome to <span style="color:#4f46e5">DirectPlay</span>${n ? `, ${n}` : ""} 🎉</h2>
      <p>Thanks for signing up. You now have access to lessons, notes, and job-ready projects.</p>
      <p>Get started here: <a href="https://directplay.in" target="_blank">directplay.in</a></p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>
      <p style="font-size:12px;color:#6b7280">You’re getting this because you created an account on DirectPlay.</p>
    </div>
  `;

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSent(null);
        if (!validate()) return;

        setLoading(true);
        track("auth_signup_attempt");

        try {
            // (temporary) simulate creating user in DB
            await new Promise((r) => setTimeout(r, 500));

            // transactional welcome email
            try {
                const res = await fetch("/api/email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        to: email,
                        subject: "Welcome to DirectPlay 🚀",
                        html: welcomeTemplate(name),
                    }),
                });
                if (!res.ok) throw new Error(await res.text());
                setSent("ok");
                track("email_welcome_sent", { to: "self" });
            } catch {
                setSent("err");
            }

            // go home
            router.push("/?signup=1");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                    id="name"
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "name-err" : undefined}
                />
                {errors.name && <p id="name-err" className="text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? "email-err" : undefined}
                />
                {errors.email && <p id="email-err" className="text-xs text-red-600">{errors.email}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Input
                        id="password"
                        type={showPwd ? "text" : "password"}
                        placeholder="Create a password"
                        value={pwd}
                        onChange={(e) => setPwd(e.target.value)}
                        aria-invalid={!!errors.pwd}
                        aria-describedby={errors.pwd ? "pwd-err" : undefined}
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPwd((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                        aria-label={showPwd ? "Hide password" : "Show password"}
                    >
                        {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* strength meter */}
                {!!pwd && (
                    <div className="mt-2" aria-live="polite">
                        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden" aria-hidden="true">
                            <div className={`h-full transition-all ${strengthColor(pwScore)}`} style={{ width: `${(pwScore / 4) * 100}%` }} />
                        </div>
                        <div className="mt-1 text-xs text-slate-600">
                            Strength: {strengthLabel(pwScore)}
                        </div>
                    </div>
                )}

                {errors.pwd && <p id="pwd-err" className="text-xs text-red-600">{errors.pwd}</p>}
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
                <input
                    type="checkbox"
                    className="mt-1"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                />
                <span>
                    I agree to the{" "}
                    <a className="text-indigo-600 hover:underline">Terms</a> and{" "}
                    <a className="text-indigo-600 hover:underline">Privacy Policy</a>.
                </span>
            </label>
            {errors.agree && <p className="text-xs text-red-600">{errors.agree}</p>}

            <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Create account
            </Button>

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

            <div className="text-sm text-center text-slate-600">
                Already have an account?{" "}
                <a href="/auth?view=signin" className="text-indigo-600 hover:underline">Sign in</a>
            </div>
        </form>
    );
}