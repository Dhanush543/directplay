"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { track } from "@/lib/analytics";

const STORAGE_KEY = "dp_popup_dismissed";

export default function BottomPopup() {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
        if (!dismissed) {
            const id = setTimeout(() => {
                setOpen(true);
                track("popup_shown", { location: "bottom_popup" });
            }, 600);
            return () => clearTimeout(id);
        }
    }, []);

    const dismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, "1");
        } catch { }
        setOpen(false);
        track("popup_dismiss", { location: "bottom_popup" });
    };

    if (!open) return null;

    return (
        <div role="dialog" aria-live="polite" className={clsx("fixed inset-x-0 bottom-3 z-30", "px-3 sm:px-4")}>
            <div
                className={clsx(
                    "mx-auto w-full max-w-5xl",
                    "rounded-2xl border border-slate-200 bg-white shadow-lg",
                    "px-4 sm:px-5 py-3 sm:py-3.5",
                    "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                )}
            >
                <div className="flex items-start sm:items-center gap-3">
                    <span className="mt-0.5 sm:mt-0 rounded-lg bg-indigo-50 text-indigo-700 p-2">
                        <MessageSquare className="h-5 w-5" />
                    </span>
                    <div className="text-sm">
                        <div className="font-medium text-slate-900">Questions? Talk to us</div>
                        <div className="text-slate-600">Next cohort seats filling fast.</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                        asChild
                        variant="secondary"
                        className="h-9"
                        onClick={() => track("syllabus_preview_click", { location: "bottom_popup" })}
                    >
                        <Link href="/#courses">Preview Syllabus</Link>
                    </Button>

                    <Button
                        asChild
                        className="h-9 gap-2"
                        onClick={() =>
                            track("buy_click", {
                                id: "java-fundamentals",
                                title: "Java Fundamentals",
                                location: "bottom_popup",
                            })
                        }
                    >
                        <Link href="/courses/java-fundamentals">
                            Buy Java Course <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>

                    <button
                        aria-label="Dismiss"
                        onClick={dismiss}
                        className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}