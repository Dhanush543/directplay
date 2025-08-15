import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SignInForm from "@/components/auth/SignInForm";

export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
    title: "Sign in – DirectPlay",
    description: "Access your DirectPlay account.",
    alternates: { canonical: "/signin" },
};

export default function SignInPage() {
    return (
        <main className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Sign in</CardTitle>
                    <CardDescription>Welcome back! Enter your credentials to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Client-only logic lives inside this component */}
                    <SignInForm />
                    <div className="mt-4 text-sm text-slate-600">
                        Don’t have an account?{" "}
                        <Button asChild variant="link" className="px-1 h-auto">
                            <Link href="/signup">Create one</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}