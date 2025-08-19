/*
  Warnings:

  - You are about to drop the column `duration` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `freePreview` on the `Lesson` table. All the data in the column will be lost.
  - You are about to drop the column `slug` on the `Lesson` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Lesson_courseId_idx";

-- DropIndex
DROP INDEX "Lesson_slug_idx";

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "comingSoon" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "durationHours" INTEGER,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "ogImage" TEXT,
ADD COLUMN     "points" JSONB,
ADD COLUMN     "previewPoster" TEXT,
ADD COLUMN     "priceINR" INTEGER,
ADD COLUMN     "published" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Lesson" DROP COLUMN "duration",
DROP COLUMN "freePreview",
DROP COLUMN "slug";

-- CreateIndex
CREATE INDEX "Lesson_courseId_index_idx" ON "Lesson"("courseId", "index");

-- CreateIndex
CREATE INDEX "LessonNote_lessonId_idx" ON "LessonNote"("lessonId");

-- CreateIndex
CREATE INDEX "LessonProgress_lessonId_idx" ON "LessonProgress"("lessonId");

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonNote" ADD CONSTRAINT "LessonNote_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
