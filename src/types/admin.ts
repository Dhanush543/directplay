

// src/types/admin.ts
// DTOs for admin APIs – keep TS strict

export type UserRole = "USER" | "ADMIN";

export interface AdminUserDTO {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    role: UserRole;
    createdAt: string;
    updatedAt: string;
}

export type CourseLevel = "Beginner" | "Intermediate" | "Advanced";

export interface AdminCourseDTO {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    level?: CourseLevel | null;
    durationHours?: number | null;
    priceINR?: number | null;
    points?: string[] | null;
    ogImage?: string | null;
    previewPoster?: string | null;
    published: boolean;
    comingSoon: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AdminLessonDTO {
    id: string;
    title: string;
    slug: string;
    courseId: string;
    order: number;
    videoUrl?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface AdminMediaDTO {
    id: string;
    url: string;
    type: "image" | "video" | "file";
    createdAt: string;
    deletedAt?: string | null;
}

export interface AdminEnrollmentDTO {
    id: string;
    userId: string;
    courseId: string;
    createdAt: string;
    active: boolean;
}

export interface AdminNotificationDTO {
    id: string;
    message: string;
    createdAt: string;
    sentBy: string;
}

export interface AdminSettingsDTO {
    siteName: string;
    supportEmail: string;
    storageProvider: "s3" | "cloudflare";
    emailProvider: "resend";
}

export interface AdminAuditLogDTO {
    id: string;
    action: string;
    entity: string;
    summary: string;
    payload?: Record<string, unknown>;
    createdAt: string;
    userId: string;
}