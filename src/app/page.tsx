// src/app/page.tsx
import type { Metadata } from "next";
import HomeClient from "./home-client";
import { siteUrl } from "@/lib/site";

// Build statically + revalidate daily
export const dynamic = "force-static";
export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: "DirectPlay — Master Java. Crack Your Dream Job.",
  description:
    "Job-focused Java courses with interactive notes, quizzes, and interview prep. Learn fast. Learn right.",
  openGraph: {
    title: "DirectPlay — Master Java. Crack Your Dream Job.",
    description:
      "Job-focused Java courses with interactive notes, quizzes, and interview prep. Learn fast. Learn right.",
    url: `${siteUrl}/`,
    siteName: "DirectPlay",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DirectPlay" }],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DirectPlay — Master Java. Crack Your Dream Job.",
    description:
      "Job-focused Java courses with interactive notes, quizzes, and interview prep. Learn fast. Learn right.",
    images: ["/og.png"],
  },
  alternates: {
    canonical: "https://directplay.in/",
  },
};

export default function Page() {
  return <HomeClient />;
}