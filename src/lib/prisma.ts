// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
    // Allow global prisma reuse in dev without TS complaining.
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    global.prisma ??
    new PrismaClient({
        // Keep your local logs as-is; keep prod quiet.
        log:
            process.env.NODE_ENV === "development"
                ? (["query", "error", "warn"] as const)
                : (["error"] as const),
    });

// Prevent creating new PrismaClient on hot-reload in dev
if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;