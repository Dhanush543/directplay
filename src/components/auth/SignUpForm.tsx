"use client";

import { useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff, Loader2 } from "lucide-react";

export default function SignUpForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [pwd, setPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [agree, setAgree] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ name?: string; email?: string; pwd?: string; agree?: string }>({});

    function validate() {
        const e: typeof errors = {};
        if (!name.trim()) e.name = "Enter your name.";
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email.";
        if (pwd.length < 6) e.pwd = "Password must be at least 6 characters.";
        if (!agree) e.agree = "You must accept the Terms.";
        setErrors(e);
        return Object.keys(e).length === 0;
    }

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        track("auth_signup_attempt");
        await new Promise((r) => setTimeout(r, 900));
        setLoading(false);
        alert("Demo only: Sign‑up UI complete (no backend wired).");
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

            <div className="text-sm text-center text-slate-600">
                Already have an account?{" "}
                <Link href="/signin" className="text-indigo-600 hover:underline">
                    Sign in
                </Link>
            </div>
        </form>
    );
}