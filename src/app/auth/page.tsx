// src/app/auth/page.tsx
"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, cubicBezier } from "framer-motion";
import SignInCard from "@/components/auth/SignInCard";
import SignUpCard from "@/components/auth/SignUpCard";
import { track } from "@/lib/analytics";


export default function AuthPage() {
    const params = useSearchParams();
    const router = useRouter();
    const view = (params.get("view") || "signin") as "signin" | "signup";
    const isSignIn = view === "signin";

    const setView = (v: "signin" | "signup") => {
        // 🔎 analytics: toggle
        if (v !== view) track("auth_view_toggle", { from: view, to: v });

        const sp = new URLSearchParams(params.toString());
        sp.set("view", v);
        router.replace(`/auth?${sp.toString()}`);
    };

    // Soft hero glow motion
    const halo = useMemo(
        () => ({
            initial: { opacity: 0, scale: 0.98, y: -6 },
            animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45 } },
        }),
        []
    );

    // Use a typed easing function to satisfy TS
    const easeOutQuintish = cubicBezier(0.22, 1, 0.36, 1);

    // Curtain reveal variants (typed via easing fn)
    const activeDown = {
        initial: { y: -24, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.45, ease: easeOutQuintish },
        },
        exit: { y: -24, opacity: 0, transition: { duration: 0.25 } },
    };

    const inactiveUp = {
        initial: { y: 24, opacity: 0 },
        animate: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.45, ease: easeOutQuintish },
        },
        exit: { y: 24, opacity: 0, transition: { duration: 0.25 } },
    };

    return (
        <main className="relative">
            {/* Soft hero glow */}
            <motion.div
                {...halo}
                className="absolute inset-x-0 top-0 -z-10 h-[240px] sm:h-[280px] bg-[radial-gradient(1200px_360px_at_50%_0%,rgba(99,102,241,.22),rgba(236,72,153,.18),transparent_70%)]"
            />

            {/* Fill viewport below the fixed 4rem header */}
            <section className="min-h-[calc(100vh-4rem)] flex flex-col">
                {/* Heading */}
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
                    <h1 className="text-3xl font-extrabold">Welcome to DirectPlay</h1>
                    <p className="mt-1 text-slate-600">
                        Sign in to continue learning, or create a new account.
                    </p>
                </div>

                {/* Cards frame (bounded height) + a little top gap */}
                <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex-1 min-h-0 pb-8 mt-5 sm:mt-6">
                    <div
                        className={[
                            "w-full rounded-3xl bg-white/70 ring-1 ring-black/5 shadow-xl shadow-slate-900/5",
                            "p-4 sm:p-6",
                            // Bounded height so the footer sits right under the hero
                            "h-[clamp(540px,calc(100vh-18rem),720px)]",
                            "min-h-0",
                        ].join(" ")}
                    >
                        {/* Grid fills the frame */}
                        <div className="grid h-full min-h-0 gap-6 md:grid-cols-2 items-stretch">
                            {/* SIGN IN column */}
                            <motion.div
                                className="h-full min-h-0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                            >
                                <div
                                    className={[
                                        "relative h-full min-h-0 rounded-2xl bg-white",
                                        isSignIn
                                            ? "shadow-2xl ring-1 ring-black/5"
                                            : "shadow-md ring-1 ring-slate-200 opacity-80 blur-[0.3px] saturate-[.95]",
                                    ].join(" ")}
                                >
                                    <div className="absolute inset-0">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {isSignIn ? (
                                                // Active: slide DOWN
                                                <motion.div
                                                    key="signin-form"
                                                    {...activeDown}
                                                    className="h-full overflow-auto"
                                                >
                                                    <div className="h-full p-6 sm:p-7 md:p-8">
                                                        <div className="w-full max-w-md mx-auto">
                                                            <SignInCard onSwitch={() => setView("signup")} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                // Inactive: slide UP (pitch centered)
                                                <motion.div
                                                    key="signin-pitch"
                                                    {...inactiveUp}
                                                    className="h-full grid place-items-center"
                                                >
                                                    <div className="text-center max-w-sm p-6 sm:p-7 md:p-8">
                                                        <h3 className="text-lg font-semibold text-slate-800">
                                                            Already a member?
                                                        </h3>
                                                        <p className="mt-2 text-slate-600">
                                                            Welcome back! Sign in to continue your lessons and
                                                            projects right where you left off.
                                                        </p>
                                                        <button
                                                            onClick={() => setView("signin")}
                                                            className="mt-5 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                        >
                                                            Sign in
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>

                            {/* SIGN UP column */}
                            <motion.div
                                className="h-full min-h-0"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: 0.12 }}
                            >
                                <div
                                    className={[
                                        "relative h-full min-h-0 rounded-2xl bg-white",
                                        !isSignIn
                                            ? "shadow-2xl ring-1 ring-black/5"
                                            : "shadow-md ring-1 ring-slate-200 opacity-80 blur-[0.3px] saturate-[.95]",
                                    ].join(" ")}
                                >
                                    <div className="absolute inset-0">
                                        <AnimatePresence mode="wait" initial={false}>
                                            {!isSignIn ? (
                                                // Active: slide DOWN
                                                <motion.div
                                                    key="signup-form"
                                                    {...activeDown}
                                                    className="h-full overflow-auto"
                                                >
                                                    <div className="h-full p-6 sm:p-7 md:p-8">
                                                        <div className="w-full max-w-md mx-auto">
                                                            <SignUpCard onSwitch={() => setView("signin")} />
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                // Inactive: slide UP (pitch centered)
                                                <motion.div
                                                    key="signup-pitch"
                                                    {...inactiveUp}
                                                    className="h-full grid place-items-center"
                                                >
                                                    <div className="text-center max-w-sm p-6 sm:p-7 md:p-8">
                                                        <h3 className="text-lg font-semibold text-slate-800">
                                                            New here?
                                                        </h3>
                                                        <p className="mt-2 text-slate-600">
                                                            Create a free account to unlock lessons, notes,
                                                            quizzes, and job‑ready projects.
                                                        </p>
                                                        <button
                                                            onClick={() => setView("signup")}
                                                            className="mt-5 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-white hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                                                        >
                                                            Create account
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}