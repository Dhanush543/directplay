"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

export default function CourseAnalytics({ slug }: { slug: string }) {
    useEffect(() => {
        track("course_view", { slug });
    }, [slug]);

    return null;
}