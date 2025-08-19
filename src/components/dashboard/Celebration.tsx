//src/components/dashboard/Celebration.tsx
"use client";

import * as React from "react";
import Link from "next/link";

type Props = {
    title: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
    className?: string;
};

export default function Celebration({ title, subtitle, ctaLabel, ctaHref = "#", className = "" }: Props) {
    // tiny confetti/emoji float
    const [burst, setBurst] = React.useState(false);
    React.useEffect(() => {
        const t = setTimeout(() => setBurst(true), 120);
        const r = setTimeout(() => setBurst(false), 2200);
        return () => {
            clearTimeout(t);
            clearTimeout(r);
        };
    }, []);

    return (
        <div
            className={`relative overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4 ${className}`}
        >
            {/* floating emojis */}
            {burst && (
                <div className="pointer-events-none absolute inset-0">
                    <FloatingEmojis />
                </div>
            )}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <div className="font-semibold text-emerald-800">{title}</div>
                    {subtitle && <div className="text-sm text-emerald-700">{subtitle}</div>}
                </div>
                {ctaLabel && (
                    <Link
                        href={ctaHref}
                        className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                        {ctaLabel}
                    </Link>
                )}
            </div>
        </div>
    );
}

function FloatingEmojis() {
    const items = ["🎉", "✨", "🎊", "⭐️", "🚀"];
    return (
        <div className="absolute inset-0">
            {Array.from({ length: 14 }).map((_, i) => {
                const emoji = items[i % items.length];
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const dur = 2 + Math.random() * 1.2;
                const size = 16 + Math.random() * 10;
                return (
                    <span
                        key={i}
                        style={{
                            left: `${left}%`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${dur}s`,
                            fontSize: `${size}px`,
                        }}
                        className="absolute -bottom-4 animate-floatUp select-none"
                    >
                        {emoji}
                    </span>
                );
            })}
            <style jsx>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(-160px) rotate(20deg);
            opacity: 0;
          }
        }
        .animate-floatUp {
          animation-name: floatUp;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
      `}</style>
        </div>
    );
}