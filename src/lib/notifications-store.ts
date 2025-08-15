// src/lib/notifications-store.ts
"use client";

import { useSyncExternalStore } from "react";

// Single source of truth for the unread badge in the header.
// Persisted in localStorage and exposed via useSyncExternalStore.

const UNREAD_KEY = "dp_unread_count_v1";

// ----- persistence helpers -----
function readLS(): number {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(UNREAD_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

function writeLS(n: number) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UNREAD_KEY, String(n));
}

// ----- external store machinery -----
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
    listeners.add(listener);

    // Keep multiple tabs in sync
    function onStorage(e: StorageEvent) {
        if (e.key === UNREAD_KEY) listener();
    }
    window.addEventListener("storage", onStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
    };
}

function getSnapshot() {
    return readLS();
}
function getServerSnapshot() {
    return 0;
}

function emit() {
    // Schedule after the current render tick to avoid React warnings.
    queueMicrotask(() => {
        for (const l of Array.from(listeners)) l();
    });
}

// ----- public API -----
export function useUnreadCount() {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setUnreadCount(n: number) {
    const v = Math.max(0, Math.floor(n || 0));
    writeLS(v);
    emit();
}

export function incUnread(delta = 1) {
    setUnreadCount(readLS() + (delta || 0));
}

export function clearUnread() {
    setUnreadCount(0);
}