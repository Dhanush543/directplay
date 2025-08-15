// src/app/api/email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendTransactionalEmail } from "@/lib/email";

type EmailRequestBody = {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
};

export async function POST(req: NextRequest) {
    try {
        if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
            return NextResponse.json(
                { error: "Email not configured on server." },
                { status: 500 }
            );
        }

        const body = (await req.json().catch(() => ({}))) as Partial<EmailRequestBody>;
        const { to, subject, html, text } = body;

        if (!to || !subject || (!html && !text)) {
            return NextResponse.json(
                { error: "Missing required fields: to, subject, and html or text." },
                { status: 400 }
            );
        }

        // Basic abuse-guard: only allow same-origin calls in production
        if (process.env.NODE_ENV === "production") {
            const origin = req.headers.get("origin") || "";
            const host = req.headers.get("host") || "";
            const allowed =
                origin.includes(host) ||
                origin === `https://${host}` ||
                origin === `http://${host}`;
            if (!allowed) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        }

        const result = await sendTransactionalEmail({
            to,
            subject,
            html,
            text,
        });

        return NextResponse.json({ id: result?.data?.id ?? null });
    } catch (err: unknown) {
        const message =
            err instanceof Error ? err.message : "Email send failed";
        // eslint-disable-next-line no-console
        console.error("Email send failed:", err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}