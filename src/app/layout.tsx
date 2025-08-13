// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Suspense } from "react"; // ← added
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Rocket } from "lucide-react";
import HeaderSearch from "@/components/HeaderSearch";
import BottomPopup from "@/components/BottomPopup";
import { siteUrl } from "@/lib/site";

const plausibleDomain =
  process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "directplay.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DirectPlay",
  description: "Job-focused Java courses with interactive notes.",
  alternates: { canonical: "/" },
  icons: {
    icon: "/favicon.ico?v=1",
    shortcut: "/favicon.ico?v=1",
    apple: "/apple-touch-icon.png?v=1",
  },
  openGraph: {
    title: "DirectPlay – Learn Java the Smart Way",
    description: "Job-focused Java courses with interactive notes.",
    url: siteUrl,
    siteName: "DirectPlay",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay Preview" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DirectPlay – Learn Java the Smart Way",
    description: "Job-focused Java courses with interactive notes.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const webSiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteUrl,
    name: "DirectPlay",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen h-full bg-white text-slate-900 flex flex-col">
        {/* Fixed Global Nav */}
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white border-b border-slate-200">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center text-white font-bold">
                DP
              </div>
              <span className="font-semibold">DirectPlay</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">Home</Link>
              <Link href="/#courses" className="hover:text-slate-900">Courses</Link>
              <Link href="/#demo" className="hover:text-slate-900">Live Demo</Link>
              <Link href="/#outcomes" className="hover:text-slate-900">Outcomes</Link>
              <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
              <Link href="/faq" className="hover:text-slate-900">FAQ</Link>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              {/* Wrapped in Suspense because HeaderSearch uses useSearchParams */}
              <Suspense fallback={<div className="h-9 w-72" aria-hidden />}>
                <HeaderSearch />
              </Suspense>
              <Button asChild variant="ghost" className="hidden lg:inline-flex">
                <Link href="/auth?view=signin">Sign in</Link>
              </Button>
              <Button asChild className="gap-2">
                <Link href="/auth?view=signup">
                  Start Learning <Rocket className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Offset for fixed header */}
        <main className="flex-1 pt-16">{children}</main>

        <Separator />

        {/* Global Footer */}
        <footer className="py-10 text-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 grid place-items-center text-white text-xs font-bold">
                  DP
                </div>
                <span className="font-semibold">DirectPlay</span>
              </Link>
              <p className="mt-3 text-slate-600">Learn. Share. Play. Directly.</p>
            </div>
            <div>
              <div className="font-semibold mb-2">Product</div>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/#courses" className="hover:text-slate-900">Courses</Link></li>
                <li><Link href="/pricing" className="hover:text-slate-900">Pricing</Link></li>
                {/* Removed Roadmap */}
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Company</div>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/about" className="hover:text-slate-900">About</Link></li>
                <li><Link href="/contact" className="hover:text-slate-900">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-slate-900">Careers</Link></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-2">Legal</div>
              <ul className="space-y-2 text-slate-600">
                <li><Link href="/terms" className="hover:text-slate-900">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-slate-900">Privacy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-slate-900">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-slate-500">
            © {new Date().getFullYear()} DirectPlay. All rights reserved.
          </div>
        </footer>

        <BottomPopup />

        {/* JSON-LD (WebSite) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />

        {/* Plausible Analytics */}
        <script
          defer
          data-domain={plausibleDomain}
          src="https://plausible.io/js/script.tagged-events.js"
        />
        <noscript>
          <img
            src={`https://plausible.io/api/event?name=pageview&domain=${encodeURIComponent(
              plausibleDomain
            )}`}
            alt=""
            referrerPolicy="no-referrer-when-downgrade"
          />
        </noscript>
      </body>
    </html>
  );
}