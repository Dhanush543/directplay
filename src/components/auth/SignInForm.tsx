// src/components/auth/SignInForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function SignInForm() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setLoading(true);

        const res = await signIn("email", {
            email,
            redirect: false,         // we’ll show the “check email” state
            callbackUrl: "/dashboard",
        });

        setLoading(false);

        if (res?.ok) {
            setSent(true);
        } else {
            setErr("Could not send sign-in link. Please try again.");
        }
    }

    if (sent) {
        return (
            <div className="space-y-3">
                <h3 className="text-lg font-semibold">Check your email</h3>
                <p className="text-sm text-slate-600">
                    We sent a secure sign-in link to <b>{email}</b>. The link expires in 10 minutes.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    aria-invalid={!!err}
                />
                {err && <p className="text-xs text-red-600">{err}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending link…" : "Send sign-in link"}
            </Button>
        </form>
    );
}