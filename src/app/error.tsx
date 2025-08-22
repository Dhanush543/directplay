// src/app/error.tsx
'use client';

import React from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center bg-neutral-50 text-neutral-900">
            <div className="max-w-md text-center space-y-4">
                <h1 className="text-2xl font-semibold">Something went wrong</h1>
                {error?.message ? (
                    <p className="text-sm text-neutral-600 break-all">{error.message}</p>
                ) : null}
                <button
                    onClick={reset}
                    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}