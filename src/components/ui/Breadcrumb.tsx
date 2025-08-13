// src/components/Breadcrumb.tsx
"use client";

import Link from "next/link";
import { Home as HomeIcon } from "lucide-react";
import type { ReactNode } from "react";

type Crumb = {
    label: string;
    href?: string;      // omit for the current page
    icon?: ReactNode;   // optional icon (we use for Home)
};

export default function Breadcrumb({ items }: { items: Crumb[] }) {
    return (
        <nav
            aria-label="Breadcrumb"
            className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 text-sm text-slate-600"
        >
            <ol className="flex items-center gap-1">
                {items.map((item, i) => {
                    const isLast = i === items.length - 1;
                    const content = (
                        <span
                            className={
                                isLast
                                    ? "text-slate-700 font-medium capitalize"
                                    : "hover:text-slate-900 flex items-center gap-1"
                            }
                        >
                            {item.icon ?? null}
                            {item.label}
                        </span>
                    );

                    return (
                        <li key={i} className="flex items-center gap-1">
                            {item.href && !isLast ? <Link href={item.href}>{content}</Link> : content}
                            {!isLast && <span>/</span>}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

// convenience export for the home crumb
export const homeCrumb = {
    label: "Home",
    href: "/",
    icon: <HomeIcon className="h-4 w-4" />,
};