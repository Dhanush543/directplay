// src/app/robots.ts
import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // Block utility/low-value routes
                disallow: [
                    "/api/",
                    "/auth/callback",   // OAuth callback
                    "/search",          // avoid indexing search results
                    "/_next/",          // build assets (usually ignored anyway)
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
        host: siteUrl, // optional; Bing/Yandex may use it, Google ignores
    };
}