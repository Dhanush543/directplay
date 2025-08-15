// src/lib/email.ts
import { Resend } from "resend";
import type { CreateEmailOptions } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const defaultFrom = process.env.RESEND_FROM; // e.g. 'DirectPlay <send@directplay.in>'

if (!resendApiKey) {
    // eslint-disable-next-line no-console
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
 * We intentionally use the html/text branch. Some versions of `resend` types
 * incorrectly require `react`, so we adapt types safely without `any`.
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

    // An internal type that matches the non-React usage of the API.
    type HtmlOnlyEmailOptions = Omit<CreateEmailOptions, "react"> & {
        react?: undefined;
    };

    const payload: HtmlOnlyEmailOptions = {
        from,
        to,
        subject,
        html,
        text,
        headers: {
            "List-Unsubscribe": listUnsub,
            ...headers,
        },
    };

    // Cast once to satisfy the library’s broader union type.
    const result = await resend.emails.send(
        payload as unknown as CreateEmailOptions
    );
    return result;
}