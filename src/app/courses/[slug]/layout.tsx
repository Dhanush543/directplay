import type { Metadata } from "next";
import { getCourseById } from "@/lib/courses";
import { siteUrl } from "@/lib/site";
import CourseAnalytics from "@/components/CourseAnalytics";

type Props = {
    children: React.ReactNode;
    // Next 15: params is async in server components
    params: Promise<{ slug: string }>;
};

// Per-course <title>, description, canonical, OG/Twitter
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const course = getCourseById(slug);

    const url = `${siteUrl}/courses/${slug}`;
    const image = course?.ogImage || "/og.png";
    const title = course ? `${course.title} – DirectPlay` : "Course not found – DirectPlay";
    const description =
        course?.description ?? "The course you’re looking for does not exist.";

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            siteName: "DirectPlay",
            images: [{ url: image, width: 1200, height: 630, alt: course?.title ?? "DirectPlay" }],
            type: "article",
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function CourseLayout({ children, params }: Props) {
    const { slug } = await params;
    const course = getCourseById(slug);
    const url = `${siteUrl}/courses/${slug}`;
    const image = course?.ogImage || "/og.png";

    // Breadcrumb JSON-LD
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
            { "@type": "ListItem", position: 2, name: "Courses", item: `${siteUrl}/courses` },
            { "@type": "ListItem", position: 3, name: (slug || "").replace(/-/g, " "), item: url },
        ],
    };

    // Course + Offer JSON-LD (only if course exists)
    const courseJsonLd = course && {
        "@context": "https://schema.org",
        "@type": "Course",
        name: course.title,
        description: course.description,
        url,
        image: image.startsWith("http") ? image : `${siteUrl}${image}`,
        provider: {
            "@type": "Organization",
            name: "DirectPlay",
            sameAs: siteUrl,
        },
        offers: {
            "@type": "Offer",
            url,
            priceCurrency: "INR",
            price: course.priceINR,
            availability: "https://schema.org/InStock",
        },
    };

    return (
        <>
            {/* Analytics event for course view */}
            <CourseAnalytics slug={slug} />

            {children}

            {/* JSON-LD (Breadcrumb) */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* JSON-LD (Course + Offer) */}
            {course && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
                />
            )}
        </>
    );
}