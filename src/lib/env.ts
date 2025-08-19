// src/lib/env.ts
/**
 * Typed, validated access to environment variables.
 * - No external deps
 * - Safe parsing for lists & numbers
 * - Optional storage provider gating (S3 or Cloudflare Stream)
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const admins = env.adminEmails; // string[]
 *   const dbUrl = env.db.databaseUrl; // string
 *   env.assert.uploads(); // throws if required storage keys are missing
 */

type StorageProvider = "s3" | "cloudflare" | "none";

/** Read a string env var (optionally required). */
function read(name: string, required = false): string | undefined {
    const v = process.env[name];
    if (required && (!v || v.length === 0)) {
        throw new Error(`[env] Missing required environment variable: ${name}`);
    }
    return v;
}

/** Parse a comma-separated list into trimmed items (empties removed). */
function parseList(input: string | undefined): string[] {
    if (!input) return [];
    return input
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Parse a boolean ("true"/"1" => true). */
function parseBool(input: string | undefined, fallback = false): boolean {
    if (!input) return fallback;
    const v = input.toLowerCase();
    return v === "true" || v === "1" || v === "yes";
}

/** Determine storage provider from explicit var or by presence of keys. */
function detectStorageProvider(): StorageProvider {
    const explicit = read("STORAGE_PROVIDER");
    if (explicit === "s3" || explicit === "cloudflare") return explicit;

    // Heuristic: infer from which key-set exists
    const hasS3 =
        !!read("S3_ACCESS_KEY_ID") &&
        !!read("S3_SECRET_ACCESS_KEY") &&
        !!read("S3_BUCKET");
    const hasCF =
        !!read("CF_ACCOUNT_ID") &&
        !!read("CF_STREAM_API_TOKEN");

    if (hasS3) return "s3";
    if (hasCF) return "cloudflare";
    return "none";
}

const provider: StorageProvider = detectStorageProvider();

export const env = {
    node: {
        nodeEnv: read("NODE_ENV") ?? "development",
    },

    app: {
        /** Public base URL (used for links in emails, callbacks, etc.) */
        url: read("NEXT_PUBLIC_APP_URL") || read("AUTH_URL") || "http://localhost:3000",
    },

    auth: {
        secret: read("AUTH_SECRET") || read("NEXTAUTH_SECRET") || "",
        url: read("AUTH_URL") || read("NEXT_PUBLIC_APP_URL") || "",
        trustHost: parseBool(read("AUTH_TRUST_HOST"), true),
    },

    db: {
        databaseUrl: read("DATABASE_URL", true)!,
        directUrl: read("DIRECT_URL") || undefined,
        shadowUrl: read("SHADOW_DATABASE_URL") || undefined,
    },

    email: {
        resendKey: read("RESEND_API_KEY") || "",
        from: read("RESEND_FROM") || "DirectPlay <send@directplay.in>",
    },

    adminEmails: parseList(read("ADMIN_EMAILS")),

    storage: {
        provider,
        // S3 / R2 compatible (R2 works with S3 client when using access keys)
        s3:
            provider === "s3"
                ? {
                    accessKeyId: read("S3_ACCESS_KEY_ID", true)!,
                    secretAccessKey: read("S3_SECRET_ACCESS_KEY", true)!,
                    region: read("S3_REGION") || "auto",
                    bucket: read("S3_BUCKET", true)!,
                    /**
                     * Optional public base URL (e.g. "https://cdn.example.com")
                     * If omitted, your API can generate signed GETs instead.
                     */
                    publicBaseUrl: read("S3_PUBLIC_BASE_URL") || undefined,
                    // Optional S3-compatible custom endpoint (e.g., R2)
                    endpoint: read("S3_ENDPOINT") || undefined,
                }
                : undefined,

        // Cloudflare Stream (token-based)
        cloudflare:
            provider === "cloudflare"
                ? {
                    accountId: read("CF_ACCOUNT_ID", true)!,
                    streamToken: read("CF_STREAM_API_TOKEN", true)!,
                    // Optional: KV or R2 for thumbs if you add later
                }
                : undefined,
    },

    /** Assertions for critical feature gates to fail fast in dev. */
    assert: {
        /** Ensure uploads are correctly configured for whichever provider is active. */
        uploads(): void {
            if (env.storage.provider === "s3") {
                const s3 = env.storage.s3!;
                if (!s3.accessKeyId || !s3.secretAccessKey || !s3.bucket) {
                    throw new Error(
                        "[env] Incomplete S3 configuration. Required: S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET."
                    );
                }
            } else if (env.storage.provider === "cloudflare") {
                const cf = env.storage.cloudflare!;
                if (!cf.accountId || !cf.streamToken) {
                    throw new Error(
                        "[env] Incomplete Cloudflare Stream configuration. Required: CF_ACCOUNT_ID, CF_STREAM_API_TOKEN."
                    );
                }
            } else {
                // You can allow "none" in development if you want to skip uploads entirely.
                if (env.node.nodeEnv !== "development") {
                    throw new Error(
                        "[env] No storage provider detected. Set STORAGE_PROVIDER to 's3' or 'cloudflare' and provide the required keys."
                    );
                }
            }
        },

        /** Ensure transactional email is configured. */
        email(): void {
            if (!env.email.resendKey) {
                throw new Error("[env] RESEND_API_KEY is missing.");
            }
            if (!env.email.from) {
                throw new Error("[env] RESEND_FROM is missing.");
            }
        },

        /** Ensure authentication secrets are present. */
        auth(): void {
            if (!env.auth.secret) {
                throw new Error("[env] AUTH_SECRET (or NEXTAUTH_SECRET) is missing.");
            }
        },
    },
};

// Helpful type for consumers
export type AppEnv = typeof env;