"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

type Props = {
    href: string;
    label: string;
    method: "email" | "url";
    roleId: string;
    roleTitle: string;
    newTab?: boolean;
};

export default function CareerApplyLink({
    href,
    label,
    method,
    roleId,
    roleTitle,
    newTab,
}: Props) {
    return (
        <Button asChild className="gap-2">
            <Link
                href={href}
                target={newTab ? "_blank" : undefined}
                rel={newTab ? "noopener noreferrer" : undefined}
                onClick={() =>
                    track("career_apply_click", {
                        id: roleId,
                        method,
                        role: roleTitle,
                    })
                }
            >
                {label}
            </Link>
        </Button>
    );
}