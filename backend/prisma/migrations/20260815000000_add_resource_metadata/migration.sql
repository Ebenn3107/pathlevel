-- CreateEnum
CREATE TYPE "ResourceSourceType" AS ENUM ('ARTICLE', 'VIDEO', 'DOCUMENT', 'WEBSITE', 'OTHER');

-- AlterTable (additive, nullable metadata columns — no data transformation)
ALTER TABLE "resources" ADD COLUMN "thumbnail_url" TEXT;
ALTER TABLE "resources" ADD COLUMN "site_name" TEXT;
ALTER TABLE "resources" ADD COLUMN "source_type" "ResourceSourceType";
