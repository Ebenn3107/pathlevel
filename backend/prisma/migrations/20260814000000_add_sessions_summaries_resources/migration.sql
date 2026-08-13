-- Add optional Learning Unit context to existing sessions.
ALTER TABLE "learning_sessions" ADD COLUMN "learning_unit_id" TEXT;

-- CreateTable: learning_summaries (one per session)
CREATE TABLE "learning_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learning_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable: session_resources (M:N junction)
CREATE TABLE "session_resources" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "session_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_summaries_session_id_key" ON "learning_summaries"("session_id");
CREATE UNIQUE INDEX "session_resources_session_id_resource_id_key" ON "session_resources"("session_id", "resource_id");

-- Migrate existing learning_sessions.notes into learning_summaries.
-- Every existing Session with a non-NULL, non-empty note gets a Summary whose
-- content is the original note, linked back to its Session. Sessions without
-- a meaningful note get no Summary (skip semantics preserved).
INSERT INTO "learning_summaries" ("id", "user_id", "session_id", "content", "created_at", "updated_at")
SELECT gen_random_uuid(), s."user_id", s."id", s."notes", s."created_at", s."created_at"
FROM "learning_sessions" s
WHERE s."notes" IS NOT NULL AND btrim(s."notes") <> '';

-- AddForeignKey
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_learning_unit_id_fkey" FOREIGN KEY ("learning_unit_id") REFERENCES "learning_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_summaries" ADD CONSTRAINT "learning_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_summaries" ADD CONSTRAINT "learning_summaries_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_resources" ADD CONSTRAINT "session_resources_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "learning_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_resources" ADD CONSTRAINT "session_resources_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_resources" ADD CONSTRAINT "session_resources_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
