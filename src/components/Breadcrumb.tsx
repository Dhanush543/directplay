import Link from "next/link";
import { Home as HomeIcon, ChevronRight } from "lucide-react";
import clsx from "clsx";

export type BreadcrumbItem = {
    label: string;
    href?: string;
};

export const homeCrumb: BreadcrumbItem = {
    label: "Home",
    href: "/",
};

export default function Breadcrumb({
    items,
    className,
}: {
    items: BreadcrumbItem[];
    className?: string;
}) {
    return (
        <nav
            aria-label="Breadcrumb"
            className={clsx("text-sm text-slate-600", className)}
        >
            {/* NOTE: No extra container here. It uses the parent page's container. */}
            <ol className="flex items-center space-x-2">
                {items.map((item, idx) => {
                    const isLast = idx === items.length - 1;
                    return (
                        <li key={idx} className="flex items-center">
                            {idx === 0 ? (
                                <Link
                                    href={item.href || "#"}
                                    className="flex items-center gap-1 hover:text-slate-900"
                                >
                                    <HomeIcon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            ) : item.href ? (
                                <Link href={item.href} className="hover:text-slate-900">
                                    {item.label}
                                </Link>
                            ) : (
                                <span>{item.label}</span>
                            )}
                            {!isLast && (
                                <ChevronRight className="mx-2 h-4 w-4 text-slate-400" />
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}