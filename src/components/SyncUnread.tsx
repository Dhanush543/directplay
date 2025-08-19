// src/components/SyncUnread.tsx
"use client";

import { useEffect } from "react";
import { setUnreadCount } from "@/lib/notifications-store";

export default function SyncUnread({ count }: { count: number }) {
    useEffect(() => {
        setUnreadCount(count);
    }, [count]);

    return null;
}