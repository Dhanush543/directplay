import type { Metadata } from "next";
import { siteUrl } from "@/lib/site";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SignUpForm from "@/components/auth/SignUpForm";

export const dynamic = "force-static";
export const revalidate = 60 * 60 * 6;

export const metadata: Metadata = {
    title: "Create account – DirectPlay",
    description: "Sign up to start learning.",
    alternates: { canonical: "/signup" },
    openGraph: {
        title: "Create account – DirectPlay",
        description: "Sign up to start learning.",
        url: `${siteUrl}/signup`,
        siteName: "DirectPlay",
        images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Create account – DirectPlay",
        description: "Sign up to start learning.",
        images: ["/og.png"],
    },
};

export default function SignUpPage() {
    return (
        <main className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 py-10">
            <Card className="border-slate-200">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Create account</CardTitle>
                    <p className="text-sm text-slate-600">Join DirectPlay and start learning.</p>
                </CardHeader>
                <CardContent>
                    <SignUpForm />
                </CardContent>
            </Card>
        </main>
    );
}