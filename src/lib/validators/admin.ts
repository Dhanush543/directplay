// src/lib/validators/admin.ts
import { z } from "zod";

/* -------------------------------------------------
   Common primitives
-------------------------------------------------- */
export const cuid = z.string().min(1);
export const slug = z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        message: "Use lowercase letters, numbers and hyphens only",
    });
export const email = z.string().email();
export const urlish = z
    .string()
    .trim()
    .min(1)
    .refine(
        (v: string) => v.startsWith("/") || /^https?:\/\//i.test(v),
        "Must be an absolute http(s) URL or a site-relative path",
    );

export const userRoleSchema = z.enum(["user", "admin"]);

/* -------------------------------------------------
   Users
-------------------------------------------------- */
export const userSearchSchema = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
});
export type UserSearchInput = z.infer<typeof userSearchSchema>;

export const userRolePatchSchema = z.object({
    userId: cuid,
    role: userRoleSchema,
});
export type UserRolePatchInput = z.infer<typeof userRolePatchSchema>;

/* -------------------------------------------------
   Courses
-------------------------------------------------- */
const courseBase = z.object({
    title: z.string().trim().min(1),
    slug,
    description: z.string().trim().min(1).optional().nullable(),
    level: z
        .enum(["Beginner", "Intermediate", "Advanced"]).optional().nullable(),
    durationHours: z.coerce.number().int().min(0).optional().nullable(),
    priceINR: z.coerce.number().int().min(0).optional().nullable(),
    points: z.array(z.string().trim().min(1)).optional().nullable(),
    ogImage: z.string().trim().min(1).optional().nullable(),
    previewPoster: z.string().trim().min(1).optional().nullable(),
    published: z.boolean().default(true),
    comingSoon: z.boolean().default(false),
});

export const courseCreateSchema = courseBase.pick({
    title: true,
    slug: true,
}).extend(courseBase.omit({ title: true, slug: true }).shape);
export type CourseCreateInput = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = courseBase.partial().extend({ id: cuid });
export type CourseUpdateInput = z.infer<typeof courseUpdateSchema>;

export const courseUpsertSchema = courseBase.extend({ id: cuid.optional() });
export type CourseUpsertInput = z.infer<typeof courseUpsertSchema>;

/* -------------------------------------------------
   Lessons
-------------------------------------------------- */
export const lessonCreateSchema = z.object({
    courseId: cuid,
    title: z.string().trim().min(1),
    index: z.coerce.number().int().min(1).default(1),
    videoUrl: z.string().trim().min(1).optional().nullable(),
});
export type LessonCreateInput = z.infer<typeof lessonCreateSchema>;

export const lessonUpdateSchema = z.object({
    lessonId: cuid,
    title: z.string().trim().min(1).optional(),
    index: z.coerce.number().int().min(1).optional(),
    videoUrl: z.string().trim().min(1).optional().nullable(),
});
export type LessonUpdateInput = z.infer<typeof lessonUpdateSchema>;

export const lessonDeleteSchema = z.object({ lessonId: cuid });
export type LessonDeleteInput = z.infer<typeof lessonDeleteSchema>;

/* -------------------------------------------------
   Media
-------------------------------------------------- */
export const mediaKindSchema = z.enum(["image", "video", "other"]);

export const mediaFinalizeSchema = z.object({
    kind: mediaKindSchema,
    key: z.string().min(1),
    url: z.string().trim().min(1).optional().nullable(),
    width: z.coerce.number().int().min(0).optional().nullable(),
    height: z.coerce.number().int().min(0).optional().nullable(),
    sizeBytes: z.coerce.number().int().min(0).optional().nullable(),
    mime: z.string().trim().min(1).optional().nullable(),
    courseId: cuid.optional().nullable(),
    lessonId: cuid.optional().nullable(),
    userId: cuid.optional().nullable(),
});
export type MediaFinalizeInput = z.infer<typeof mediaFinalizeSchema>;

export const mediaDeleteSchema = z.object({ id: cuid });
export type MediaDeleteInput = z.infer<typeof mediaDeleteSchema>;

/* -------------------------------------------------
   Enrollments
-------------------------------------------------- */
export const enrollmentCreateSchema = z.object({
    userId: cuid,
    courseId: cuid,
});
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;

export const enrollmentDeleteSchema = z.object({
    id: cuid.optional(),
    userId: cuid.optional(),
    courseId: cuid.optional(),
}).refine(
    (v: { id?: string; userId?: string; courseId?: string }) =>
        Boolean(v.id || (v.userId && v.courseId)),
    {
        message: "Provide either id, or both userId and courseId",
    }
);
export type EnrollmentDeleteInput = z.infer<typeof enrollmentDeleteSchema>;

/* -------------------------------------------------
   Notifications
-------------------------------------------------- */
export const notificationTypeSchema = z.enum(["auth", "email", "system"]);

export const notificationSendSchema = z.object({
    userId: cuid.optional(), // omit for broadcast if your route supports it
    title: z.string().trim().min(1),
    meta: z.string().trim().optional().nullable(),
    type: notificationTypeSchema.default("system"),
});
export type NotificationSendInput = z.infer<typeof notificationSendSchema>;

export const notificationsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    q: z.string().optional(),
});
export type NotificationsQueryInput = z.infer<typeof notificationsQuerySchema>;

/* -------------------------------------------------
   Settings (admin)
-------------------------------------------------- */
export const settingsUpdateSchema = z.object({
    siteName: z.string().trim().min(1).optional(),
    domain: z.string().trim().min(1).optional(),
    emailFrom: z.string().trim().min(1).optional(),
    // storage keys (optional; validate presence at runtime if toggled on)
    s3AccessKeyId: z.string().trim().min(1).optional(),
    s3SecretAccessKey: z.string().trim().min(1).optional(),
    s3Region: z.string().trim().min(1).optional(),
    s3Bucket: z.string().trim().min(1).optional(),
    s3PublicBaseUrl: z.string().trim().min(1).optional(),
    // security
    ipAllowlist: z.array(z.string().trim()).optional(),
});
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

/* -------------------------------------------------
   Audit log
-------------------------------------------------- */
export const auditQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(200).default(50),
});
export type AuditQueryInput = z.infer<typeof auditQuerySchema>;

/* -------------------------------------------------
   Helpers
-------------------------------------------------- */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
        throw new Error(result.error.issues.map((i: z.ZodIssue) => i.message).join("; "));
    }
    return result.data;
}