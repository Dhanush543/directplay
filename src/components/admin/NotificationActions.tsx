// src/components/admin/NotificationActions.tsx
"use client";

import * as React from "react";
import { toggleReadAction, deleteNotificationAction } from "@/app/admin/notifications/actions";

export default function NotificationActions({
    id,
    read,
}: {
    id: string;
    read: boolean;
}) {
    const [isPending, startTransition] = React.useTransition();

    const onDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!confirm("Delete this notification?")) {
            e.preventDefault();
        }
    };

    return (
        <div className="flex items-center gap-2">
            <form action={toggleReadAction} className="inline">
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="nextRead" value={(!read).toString()} />
                <button
                    className="rounded-md border px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => startTransition(() => { })}
                >
                    Mark {read ? "unread" : "read"}
                </button>
            </form>

            <form action={deleteNotificationAction} className="inline">
                <input type="hidden" name="id" value={id} />
                <button
                    className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                    onClick={onDelete}
                    disabled={isPending}
                >
                    Delete
                </button>
            </form>
        </div>
    );
}