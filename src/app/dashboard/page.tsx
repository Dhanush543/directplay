// src/app/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function Dashboard() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    return (
        <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
            <h1 className="text-2xl font-bold">Welcome 👋</h1>
            <p className="mt-2 text-slate-600">
                Signed in as <b>{session.user.email ?? "unknown"}</b>
            </p>

            <SignOutButton className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-white hover:bg-slate-800" />
        </main>
    );
}