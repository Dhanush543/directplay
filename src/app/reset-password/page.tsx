"use client";

import { useState } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site";
import { track } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Loader2 } from "lucide-react";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 6;

export const metadata: Metadata = {
    title: "Reset password – DirectPlay",
    description: "Get a password reset link by email.",
    alternates: { canonical: "/reset-password" },
    openGraph: {
        title: "Reset password – DirectPlay",
        description: "Get a password reset link by email.",
        url: `${siteUrl}/reset-password`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Reset password – DirectPlay",
        description: "Get a password reset link by email.",
        images: ["/og.png"],
    },
};

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setMsg("Enter a valid email.");
            return;
        }
        setLoading(true);
        setMsg(null);
        track("auth_reset_request");
        await new Promise((r) => setTimeout(r, 900));
        setLoading(false);
        setMsg("If an account exists, a reset link has been sent.");
    }

    return (
        <main className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl font-bold">
                        <Mail className="h-5 w-5 text-indigo-600" /> Reset password
                    </CardTitle>
                    <p className="text-sm text-slate-600">We’ll email you a reset link.</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full gap-2" disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                            Send reset link
                        </Button>

                        {msg && <p className="text-sm text-slate-600 text-center">{msg}</p>}

                        <div className="text-sm text-center text-slate-600">
                            Remembered it?{" "}
                            <Link href="/signin" className="text-indigo-600 hover:underline">
                                Sign in
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}