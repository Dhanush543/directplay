"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";

export default function SearchBox() {
    const [q, setQ] = useState("");
    const router = useRouter();

    function onSubmit(e: FormEvent) {
        e.preventDefault();
        const query = q.trim();
        if (!query) return;
        // Route to global search (not courses-only)
        router.push(`/search?q=${encodeURIComponent(query)}`);
    }

    return (
        <form onSubmit={onSubmit} className="hidden md:block">
            <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search courses…"
                className="w-56"
                aria-label="Search courses"
            />
        </form>
    );
}