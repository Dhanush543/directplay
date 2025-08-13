// src/lib/analytics.ts
declare global {
    interface Window {
        plausible?: (event: string, options?: { props?: Record<string, any> }) => void;
    }
}

/**
 * Thin wrapper around Plausible.
 * Always sends a `site` prop so you can segment if needed.
 */
export function track(event: string, props: Record<string, any> = {}) {
    if (typeof window === "undefined") return;
    try {
        window.plausible?.(event, { props: { site: "directplay", ...props } });
    } catch {
        // no-op in dev or if Plausible script hasn't loaded yet
    }
}