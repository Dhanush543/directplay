// src/components/header/HeaderUserMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type Props = {
    name?: string;
    email?: string;
    image?: string;
};

export default function HeaderUserMenu({ name, email, image }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClick(e: MouseEvent) {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        }
        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, []);

    const initials =
        name?.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase() ||
        (email ? email[0].toUpperCase() : "U");

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-full ring-1 ring-slate-200 bg-white pl-1 pr-3 py-1.5 hover:bg-slate-50"
            >
                <span className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white grid place-items-center text-xs font-semibold overflow-hidden">
                    {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image} alt="" className="h-full w-full object-cover rounded-full" />
                    ) : (
                        initials
                    )}
                </span>
                <span className="text-sm max-w-[160px] truncate">{name || email || "You"}</span>
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg ring-1 ring-slate-200 p-1">
                    <div className="px-3 py-2">
                        <div className="text-sm font-medium truncate">{name || "Your account"}</div>
                        <div className="text-xs text-slate-500 truncate">{email}</div>
                    </div>
                    <hr className="my-1 border-slate-200" />
                    <MenuLink href="/dashboard">Dashboard</MenuLink>
                    <MenuLink href="/profile">Profile</MenuLink>
                    <MenuLink href="/settings">Settings</MenuLink>
                    <MenuLink href="/notifications">Notifications</MenuLink>
                    <MenuLink href="/billing">Billing</MenuLink>
                    <MenuLink href="/certificates">Certificates</MenuLink>
                    <hr className="my-1 border-slate-200" />
                    <button
                        className="w-full text-left rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50"
        >
            {children}
        </Link>
    );
}