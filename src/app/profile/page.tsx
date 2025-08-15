// src/app/profile/page.tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect("/auth?view=signin");

    const user = session.user;
    const displayName =
        user.name || user.email?.split("@")[0] || "Your name";
    const initials =
        user.name?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() ??
        (user.email ? user.email[0].toUpperCase() : "U");

    return (
        <main className="px-4 sm:px-6 lg:px-8 py-10 mx-auto w-full max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
                    <p className="mt-1 text-slate-600">
                        Update your account information. Editing is coming soon.
                    </p>
                </div>
                <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-700">
                    ← Back to dashboard
                </Link>
            </div>

            {/* Card */}
            <section className="mt-6 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-fuchsia-600 text-white grid place-items-center text-xl font-semibold">
                        {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="text-lg font-semibold">{displayName}</div>
                        <div className="text-sm text-slate-600">{user.email}</div>
                    </div>
                    <button
                        type="button"
                        className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200 cursor-not-allowed"
                        title="Coming soon"
                        aria-disabled
                    >
                        Change photo
                    </button>
                </div>

                <hr className="my-5 border-slate-200" />

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Full name</label>
                        <input
                            className="mt-1 w-full rounded-lg border-slate-300 ring-1 ring-slate-200 bg-white px-3 py-2 text-sm"
                            defaultValue={displayName}
                            disabled
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Email</label>
                        <input
                            className="mt-1 w-full rounded-lg border-slate-300 ring-1 ring-slate-200 bg-slate-50 px-3 py-2 text-sm"
                            defaultValue={user.email ?? ""}
                            disabled
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-slate-700">Bio</label>
                        <textarea
                            className="mt-1 w-full min-h-[96px] rounded-lg border-slate-300 ring-1 ring-slate-200 bg-white px-3 py-2 text-sm"
                            placeholder="Tell us a bit about yourself…"
                            disabled
                        />
                        <p className="mt-1 text-xs text-slate-500">Editing is coming soon.</p>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        className="rounded-lg bg-slate-900 px-4 py-2.5 text-white opacity-50 cursor-not-allowed"
                        aria-disabled
                    >
                        Save changes
                    </button>
                </div>
            </section>
        </main>
    );
}