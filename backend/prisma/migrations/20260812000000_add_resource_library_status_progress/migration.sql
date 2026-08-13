-- CreateEnum
CREATE TYPE "ResourceLibraryStatus" AS ENUM ('INBOX', 'SAVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResourceProgress" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "resources" ADD COLUMN "library_status" "ResourceLibraryStatus" NOT NULL DEFAULT 'INBOX';
ALTER TABLE "resources" ADD COLUMN "progress" "ResourceProgress" NOT NULL DEFAULT 'NOT_STARTED';

-- Backfill existing records using the approved migration mapping:
--   completed = true  -> libraryStatus = SAVED, progress = COMPLETED
--   completed = false -> libraryStatus = SAVED, progress = NOT_STARTED
UPDATE "resources" SET
  "library_status" = 'SAVED'::"ResourceLibraryStatus",
  "progress" = CASE
    WHEN "completed" THEN 'COMPLETED'::"ResourceProgress"
    ELSE 'NOT_STARTED'::"ResourceProgress"
  END;
