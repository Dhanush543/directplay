import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.RESEND_FROM; // e.g. 'DirectPlay <send@directplay.in>'

if (!resendApiKey) {
    console.warn("RESEND_API_KEY is not set. Email sending will be disabled.");
}

export const resend = new Resend(resendApiKey || "");

type SendArgs = {
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    from?: string;
    headers?: Record<string, string>;
};

/**
 * Minimal helper for transactional emails (raw HTML/text).
 */
export async function sendTransactionalEmail({
    to,
    subject,
    html,
    text,
    from = defaultFrom!,
    headers = {},
}: SendArgs) {
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");
    if (!from) throw new Error("RESEND_FROM not configured");

    const listUnsub =
        headers["List-Unsubscribe"] ||
        "<mailto:unsubscribe@directplay.in>, <https://directplay.in/unsubscribe>";

    // Force the non-React overload; runtime is perfectly valid with html/text.
    const payload = {
        from,
        to,
        subject,
        html,
        text,
        headers: {
            "List-Unsubscribe": listUnsub,
            ...headers,
        },
        react: undefined,
    };

    const result = await resend.emails.send(payload as any);
    return result;
}