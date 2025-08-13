// src/components/HeaderSearch.tsx
"use client";

import { track } from "@/lib/analytics";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X, Search as SearchIcon, Clock } from "lucide-react";
import clsx from "clsx";

import { getCourses } from "@/lib/courses";
import { faqs } from "@/lib/faq";
import { outcomes } from "@/lib/outcomes";

type Suggestion = {
    id: string;
    group: "Courses" | "FAQ" | "Outcomes";
    label: string;
    sublabel?: string;
    href: string;
};

const RECENT_KEY = "dp_recent_searches";
const MAX_RECENT = 8;
const MAX_PER_GROUP = 4;
const DEBOUNCE_MS = 200;

function highlight(text: string, q: string) {
    if (!q) return text;
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(${safe})`, "ig");
    return text.split(re).map((part, i) =>
        i % 2 === 1 ? (
            <mark key={i} className="bg-yellow-100 rounded px-0.5">
                {part}
            </mark>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

export default function HeaderSearch() {
    const router = useRouter();
    const params = useSearchParams();
    const pathname = usePathname();

    const [q, setQ] = useState(params.get("q") ?? "");
    const [preview, setPreview] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const [recent, setRecent] = useState<string[]>([]);
    const [isDebouncing, setIsDebouncing] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const wrapRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<number | null>(null);

    // Keep input synced with URL changes
    useEffect(() => {
        setQ(params.get("q") ?? "");
        setPreview(null);
    }, [params]);

    // Close dropdown when route changes
    useEffect(() => {
        setOpen(false);
        setActiveIndex(-1);
        setPreview(null);
    }, [pathname]);

    // Prefetch /search
    useEffect(() => {
        try {
            router.prefetch("/search");
        } catch { }
    }, [router]);

    // Load recent
    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_KEY);
            if (raw) setRecent(JSON.parse(raw));
        } catch { }
    }, []);

    function remember(term: string) {
        const t = term.trim();
        if (!t) return;
        try {
            const next = [t, ...recent.filter((x) => x.toLowerCase() !== t.toLowerCase())].slice(
                0,
                MAX_RECENT
            );
            setRecent(next);
            localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch { }
    }

    function clearRecent() {
        setRecent([]);
        try {
            localStorage.removeItem(RECENT_KEY);
        } catch { }
    }

    // Global keyboard helpers
    useEffect(() => {
        function onKeydown(e: KeyboardEvent) {
            if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
                const tag = (document.activeElement?.tagName || "").toLowerCase();
                if (tag !== "input" && tag !== "textarea" && tag !== "select" && !open) {
                    e.preventDefault();
                    inputRef.current?.focus();
                    setOpen(true);
                    track("search_focus_slash");
                }
            }
            if (e.key === "Escape") {
                setOpen(false);
                setActiveIndex(-1);
                setPreview(null);
                inputRef.current?.blur();
            }
        }
        window.addEventListener("keydown", onKeydown);
        return () => window.removeEventListener("keydown", onKeydown);
    }, [open]);

    // Close on outside click
    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
                setActiveIndex(-1);
                setPreview(null);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // Build suggestions (debounced)
    useEffect(() => {
        setIsDebouncing(true);
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            const trimmed = q.trim().toLowerCase();
            if (!trimmed) {
                setSuggestions([]);
                setIsDebouncing(false);
                return;
            }

            const allCourses = getCourses();
            const courseSugs: Suggestion[] = allCourses
                .filter(
                    (c) =>
                        c.title.toLowerCase().includes(trimmed) ||
                        c.description.toLowerCase().includes(trimmed) ||
                        c.points.some((p) => p.toLowerCase().includes(trimmed))
                )
                .slice(0, MAX_PER_GROUP)
                .map((c) => ({
                    id: `c:${c.id}`,
                    group: "Courses" as const,
                    label: c.title,
                    sublabel: c.description,
                    href: `/courses/${c.id}`,
                }));

            const faqSugs: Suggestion[] = faqs
                .filter((f) => f.q.toLowerCase().includes(trimmed) || f.a.toLowerCase().includes(trimmed))
                .slice(0, MAX_PER_GROUP)
                .map((f) => ({
                    id: `f:${f.q}`,
                    group: "FAQ" as const,
                    label: f.q,
                    sublabel: f.a,
                    href: `/faq#${encodeURIComponent(f.id || f.q.toLowerCase().replace(/\s+/g, "-"))}`,
                }));

            const outcomeSugs: Suggestion[] = outcomes
                .filter((o) => o.title.toLowerCase().includes(trimmed) || o.body.toLowerCase().includes(trimmed))
                .slice(0, MAX_PER_GROUP)
                .map((o) => ({
                    id: `o:${o.title}`,
                    group: "Outcomes" as const,
                    label: o.title,
                    sublabel: o.body,
                    href: "/#outcomes",
                }));

            setSuggestions([...courseSugs, ...faqSugs, ...outcomeSugs]);
            setActiveIndex(-1);
            setIsDebouncing(false);
        }, DEBOUNCE_MS);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [q]);

    // Group for render
    type Row = { header: Suggestion["group"] } | Suggestion;

    const grouped: Row[] = useMemo(() => {
        if (!q.trim()) return [];
        const buckets: Record<Suggestion["group"], Suggestion[]> = {
            Courses: [],
            FAQ: [],
            Outcomes: [],
        };
        for (const s of suggestions) buckets[s.group].push(s);

        const out: Row[] = [];
        (Object.keys(buckets) as Suggestion["group"][]).forEach((g) => {
            if (buckets[g].length) {
                out.push({ header: g });
                out.push(...buckets[g]);
            }
        });
        return out;
    }, [suggestions, q]);

    // A flat list of only suggestion rows in the same order we render them
    const flatSuggestions: Suggestion[] = useMemo(
        () => grouped.filter((r): r is Suggestion => "id" in r),
        [grouped]
    );

    const itemCount = q.trim() ? suggestions.length : recent.length;

    function goToSuggestion(s: Suggestion) {
        track("search_select_suggestion_enter", {
            term: q.trim(),
            dest: s.href,
            group: s.group,
            label: s.label,
        });
        remember(q.trim());
        setOpen(false);
        setActiveIndex(-1);
        setPreview(null);
        router.push(s.href);
    }

    function submitQuery(term: string) {
        const t = term.trim();
        if (!t) return;
        remember(t);
        setOpen(false);
        setActiveIndex(-1);
        setPreview(null);
        track("search_submit", { term: t, source: "header" });
        router.push(`/search?q=${encodeURIComponent(t)}`);
    }

    function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        // Prefer highlighted suggestion if one exists
        if (open && activeIndex >= 0) {
            if (q.trim()) {
                const sel = flatSuggestions[activeIndex];
                if (sel) return goToSuggestion(sel);
            } else {
                const term = recent[activeIndex];
                if (term) return submitQuery(term);
            }
        }
        submitQuery(preview ?? q);
    }

    function clear() {
        setQ("");
        setPreview(null);
        if (pathname === "/search") router.push("/search");
        inputRef.current?.focus();
        setOpen(true);
    }

    // Keyboard inside the input (dropdown)
    function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
        const hasQuery = q.trim().length > 0;

        if (e.key === "Enter") {
            e.preventDefault();
            // Same logic as submit: prefer the highlighted suggestion
            if (open && activeIndex >= 0) {
                if (hasQuery) {
                    const sel = flatSuggestions[activeIndex];
                    if (sel) return goToSuggestion(sel);
                } else {
                    const term = recent[activeIndex];
                    if (term) return submitQuery(term);
                }
            }
            return submitQuery(preview ?? q);
        }

        if (!open) return;

        // Arrow nav
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            const total = (hasQuery ? flatSuggestions.length : recent.length) || 0;
            if (!total) return;

            e.preventDefault();
            setActiveIndex((prev) => {
                const next =
                    e.key === "ArrowDown"
                        ? (prev + 1) % Math.max(total, 1)
                        : (prev - 1 + Math.max(total, 1)) % Math.max(total, 1);

                if (!hasQuery && recent[next]) setPreview(recent[next]);
                return next;
            });
            return;
        }

        // If user types any character, exit preview mode
        if (e.key.length === 1) setPreview(null);
    }

    return (
        <div className="relative" ref={wrapRef}>
            <form onSubmit={onSubmit} className="flex items-center gap-2" onFocus={() => setOpen(true)}>
                <div className="relative">
                    <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        ref={inputRef}
                        value={preview ?? q}
                        onChange={(e) => {
                            setPreview(null);
                            setQ(e.target.value);
                        }}
                        onKeyDown={onKeyDown}
                        placeholder="Search courses, FAQ, outcomes…"
                        className="h-9 w-72 rounded-md border border-slate-300 bg-white pl-8 pr-8 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                        aria-label="Site search"
                        onClick={() => setOpen(true)}
                    />
                    {(preview ?? q) && (
                        <button
                            type="button"
                            onClick={clear}
                            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded hover:bg-slate-100"
                            aria-label="Clear search"
                            title="Clear"
                        >
                            <X className="h-4 w-4 text-slate-500" />
                        </button>
                    )}
                </div>

                {/* Icon-only submit button to the RIGHT of the input */}
                <button
                    type="submit"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                    aria-label="Search"
                    title="Search"
                >
                    <SearchIcon className="h-4 w-4" />
                </button>
            </form>

            {open && (
                <div
                    className="absolute left-0 mt-2 w-[28rem] rounded-xl border border-slate-200 bg-white shadow-lg"
                    role="listbox"
                    aria-activedescendant={activeIndex >= 0 ? `dp-suggest-${activeIndex}` : undefined}
                >
                    {/* RECENT (no query) */}
                    {!q.trim() ? (
                        <div className="p-2">
                            <div className="flex items-center justify-between px-2 py-1 text-xs text-slate-500">
                                <span>Recent</span>
                                {recent.length > 0 && (
                                    <button onClick={clearRecent} className="text-slate-500 hover:text-slate-700">
                                        Clear
                                    </button>
                                )}
                            </div>
                            {recent.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-slate-500">No recent searches.</div>
                            ) : (
                                recent.map((term, i) => (
                                    <button
                                        id={`dp-suggest-${i}`}
                                        key={term + i}
                                        className={clsx(
                                            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50",
                                            activeIndex === i && "bg-indigo-50"
                                        )}
                                        onMouseEnter={() => {
                                            setActiveIndex(i);
                                            setPreview(term);
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => {
                                            track("search_select_recent", { term });
                                            setPreview(null);
                                            setQ(term);
                                            setOpen(false);
                                            inputRef.current?.focus();
                                        }}
                                        role="option"
                                        aria-selected={activeIndex === i}
                                    >
                                        <Clock className="h-4 w-4 text-slate-400" />
                                        <span>{term}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        // SUGGESTIONS (query present)
                        <div className="max-h-[26rem] overflow-auto py-2">
                            {itemCount === 0 && !isDebouncing && (
                                <div className="px-3 py-2 text-sm text-slate-500">No results. Press Enter to search.</div>
                            )}

                            {grouped.map((item, idx) => {
                                if ("header" in item) {
                                    return (
                                        <div
                                            key={`h-${item.header}`}
                                            className="px-3 pt-3 pb-1 text-xs font-medium uppercase tracking-wide text-slate-500"
                                        >
                                            {item.header}
                                        </div>
                                    );
                                }

                                // how many non-header items up to this point
                                const idxInDropdown =
                                    grouped.slice(0, idx + 1).reduce((acc, cur) => (("header" in cur ? acc : acc + 1)), 0) - 1;

                                return (
                                    <button
                                        id={`dp-suggest-${idxInDropdown}`}
                                        key={item.id}
                                        className={clsx(
                                            "w-full px-3 py-2 text-left text-sm hover:bg-slate-50",
                                            activeIndex === idxInDropdown && "bg-indigo-50"
                                        )}
                                        onMouseEnter={() => setActiveIndex(idxInDropdown)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => goToSuggestion(item)}
                                        role="option"
                                        aria-selected={activeIndex === idxInDropdown}
                                    >
                                        <div className="font-medium">{highlight(item.label, q)}</div>
                                        {item.sublabel && (
                                            <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                                                {highlight(item.sublabel, q)}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                        <span>
                            Press <kbd className="rounded border px-1">Enter</kbd> to select
                        </span>
                        <span>
                            Focus with <kbd className="rounded border px-1">/</kbd>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}