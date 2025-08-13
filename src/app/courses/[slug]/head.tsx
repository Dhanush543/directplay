// src/app/courses/[slug]/head.tsx
import { siteUrl } from "@/lib/site";
import { getCourseById } from "@/lib/courses";

export default function Head({ params }: { params: { slug: string } }) {
    const course = getCourseById(params.slug);

    const title = course ? `${course.title} – DirectPlay` : "Course – DirectPlay";
    const desc =
        course?.description || "Job-focused Java learning with projects, notes, and quizzes.";
    const url = `${siteUrl}/courses/${params.slug}`;
    const ogImage = "/og.png"; // swap per-course OG later if you generate them

    return (
        <>
            {/* Canonical */}
            <link rel="canonical" href={url} />

            {/* Basic */}
            <title>{title}</title>
            <meta name="description" content={desc} />

            {/* Open Graph */}
            <meta property="og:title" content={title} />
            <meta property="og:description" content={desc} />
            <meta property="og:url" content={url} />
            <meta property="og:site_name" content="DirectPlay" />
            <meta property="og:type" content="website" />
            <meta property="og:image" content={ogImage} />
            <meta property="og:image:width" content="1200" />
            <meta property="og:image:height" content="630" />
            <meta property="og:image:alt" content="DirectPlay" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={desc} />
            <meta name="twitter:image" content={ogImage} />
        </>
    );
}