// src/components/admin/ConfirmButton.tsx
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Reusable confirm button for admin actions (delete, publish, etc.).
 *
 * Usage:
 * <ConfirmButton
 *   title="Delete course?"
 *   description="This cannot be undone. All lessons will remain but the course will be hidden."
 *   confirmText="Delete"
 *   variant="destructive"
 *   onConfirm={async () => { await doDelete(); }}
 * >
 *   Delete
 * </ConfirmButton>
 */

export type ConfirmButtonProps = {
    /** Visible label or custom children inside the trigger button */
    children: React.ReactNode;
    /** Async action executed after the user confirms */
    onConfirm: () => void | Promise<void>;
    /** Optional error handler for failed confirm actions */
    onError?: (error: unknown) => void;
    /** Modal title */
    title?: string;
    /** One‑line explanation shown in the dialog */
    description?: string;
    /** Text for the confirm CTA */
    confirmText?: string;
    /** Text for the cancel CTA */
    cancelText?: string;
    /** Pass through to shadcn Button */
    variant?: React.ComponentProps<typeof Button>["variant"];
    size?: React.ComponentProps<typeof Button>["size"];
    className?: string;
    /** Disable the trigger */
    disabled?: boolean;
    /** Optional icon to render inside the trigger button (left side) */
    iconLeft?: React.ReactNode;
};

export default function ConfirmButton({
    children,
    onConfirm,
    onError,
    title = "Are you sure?",
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "secondary",
    size,
    className,
    disabled,
    iconLeft,
}: ConfirmButtonProps): React.JSX.Element {
    const [open, setOpen] = React.useState<boolean>(false);
    const [loading, setLoading] = React.useState<boolean>(false);

    // Accessibility: label/description IDs
    const labelId = React.useId();
    const descId = React.useId();

    // Focus management: return focus to trigger; focus confirm on open
    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const confirmRef = React.useRef<HTMLButtonElement | null>(null);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            await onConfirm();
            setOpen(false);
        } catch (err: unknown) {
            if (onError) onError(err);
            // keep dialog open so the user can retry or cancel
        } finally {
            setLoading(false);
        }
    };

    // Close on Escape
    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Focus confirm button when opening; return focus to trigger when closing
    React.useEffect(() => {
        if (open) {
            // defer to next tick to ensure element exists
            const id = window.setTimeout(() => {
                confirmRef.current?.focus();
            }, 0);
            return () => window.clearTimeout(id);
        }
        // when dialog just closed, restore focus
        triggerRef.current?.focus();
        return undefined;
    }, [open]);

    return (
        <>
            <Button
                ref={triggerRef}
                variant={variant}
                size={size}
                className={className}
                disabled={disabled || loading}
                onClick={() => setOpen(true)}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Working…
                    </>
                ) : (
                    <>
                        {iconLeft ? <span className="mr-2 inline-flex">{iconLeft}</span> : null}
                        {children}
                    </>
                )}
            </Button>

            {open ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelId}
                    aria-describedby={description ? descId : undefined}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => (loading ? null : setOpen(false))}
                    />

                    {/* Card */}
                    <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
                        <div id={labelId} className="text-base font-semibold">
                            {title}
                        </div>
                        {description ? (
                            <div id={descId} className="mt-1 text-sm text-slate-600">
                                {description}
                            </div>
                        ) : null}

                        <div className="mt-4 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                {cancelText}
                            </Button>
                            <Button
                                ref={confirmRef}
                                type="button"
                                variant={variant === "destructive" ? "destructive" : "default"}
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                                        {confirmText}
                                    </>
                                ) : (
                                    confirmText
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
