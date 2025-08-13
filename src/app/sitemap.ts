import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { courses } from "@/lib/courses";

// Keep the sitemap clean: no fragment URLs (#...), include core pages, and
// give reasonable changeFrequency/priority hints.

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    // Core top-level routes
    const staticPaths = [
        { path: "", change: "weekly", priority: 1.0 },
        { path: "courses", change: "weekly", priority: 0.9 },
        { path: "pricing", change: "monthly", priority: 0.7 },
        { path: "about", change: "monthly", priority: 0.6 },
        { path: "faq", change: "monthly", priority: 0.6 },
        { path: "terms", change: "yearly", priority: 0.5 },
        { path: "privacy", change: "yearly", priority: 0.5 },
        { path: "refund-policy", change: "yearly", priority: 0.5 },
        { path: "contact", change: "monthly", priority: 0.5 },
        { path: "careers", change: "monthly", priority: 0.5 },
    ] as const;

    const base: MetadataRoute.Sitemap = staticPaths.map((r) => ({
        url: `${siteUrl}/${r.path}`,
        lastModified: now,
        changeFrequency: r.change,
        priority: r.priority,
    }));

    // Course detail pages
    const courseUrls: MetadataRoute.Sitemap = (courses ?? []).map((c) => ({
        url: `${siteUrl}/courses/${c.id}`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: 0.8,
    }));

    return [...base, ...courseUrls];
}