// src/components/admin/ConfirmButton.tsx
"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ConfirmButtonProps = {
    children: React.ReactNode;
    /** For async client actions */
    onConfirm?: () => void | Promise<void>;
    /** For server actions (inside <form action={...}>) */
    formSubmit?: boolean;
    /** Optional error handler */
    onError?: (error: unknown) => void;
    /** Dialog title */
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: React.ComponentProps<typeof Button>["variant"];
    size?: React.ComponentProps<typeof Button>["size"];
    className?: string;
    disabled?: boolean;
    iconLeft?: React.ReactNode;
};

/**
 * ConfirmButton
 * Works in two modes:
 * - Wraps a server action form submit (with `formSubmit`).
 * - Runs an async `onConfirm` function directly.
 */
export default function ConfirmButton({
    children,
    onConfirm,
    formSubmit = false,
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
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const labelId = React.useId();
    const descId = React.useId();

    const triggerRef = React.useRef<HTMLButtonElement | null>(null);
    const confirmRef = React.useRef<HTMLButtonElement | null>(null);

    const handleConfirm = async () => {
        if (formSubmit) {
            // Let the enclosing form submit
            setOpen(false);
            return;
        }
        if (!onConfirm) return;
        try {
            setLoading(true);
            await onConfirm();
            setOpen(false);
        } catch (err) {
            if (onError) onError(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    React.useEffect(() => {
        if (open) {
            const id = window.setTimeout(() => confirmRef.current?.focus(), 0);
            return () => window.clearTimeout(id);
        }
        triggerRef.current?.focus();
    }, [open]);

    return (
        <>
            <Button
                ref={triggerRef}
                variant={variant}
                size={size}
                className={className}
                disabled={disabled || loading}
                type={formSubmit ? "button" : "button"}
                onClick={() => setOpen(true)}
            >
                {loading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                        Working…
                    </>
                ) : (
                    <>
                        {iconLeft && <span className="mr-2 inline-flex">{iconLeft}</span>}
                        {children}
                    </>
                )}
            </Button>

            {open && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={labelId}
                    aria-describedby={description ? descId : undefined}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                >
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => (!loading ? setOpen(false) : null)}
                    />

                    <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200">
                        <div id={labelId} className="text-base font-semibold">
                            {title}
                        </div>
                        {description && (
                            <div id={descId} className="mt-1 text-sm text-slate-600">
                                {description}
                            </div>
                        )}

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
                                type={formSubmit ? "submit" : "button"}
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
            )}
        </>
    );
}