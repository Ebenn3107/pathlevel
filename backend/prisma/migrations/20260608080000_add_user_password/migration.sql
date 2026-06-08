-- AlterTable: add password column to users
ALTER TABLE "users" ADD COLUMN "password" TEXT NOT NULL DEFAULT '';
