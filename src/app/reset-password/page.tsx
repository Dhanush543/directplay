import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";
export const revalidate = 21600; // 6h

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
    return (
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
            <header className="max-w-2xl">
                <h1 className="text-3xl font-extrabold">Reset your password</h1>
                <p className="mt-2 text-slate-600">
                    Enter the email you used for DirectPlay. We’ll send a reset link if there’s an account.
                </p>
            </header>

            <ResetPasswordClient />
        </main>
    );
}