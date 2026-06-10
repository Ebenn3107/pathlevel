-- CreateTable: HabitCompletion
CREATE TABLE "habit_completions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "habit_id" TEXT NOT NULL,
    "period_key" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "habit_completions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per habit per period
CREATE UNIQUE INDEX "habit_completions_habit_id_user_id_period_key_key" ON "habit_completions"("habit_id", "user_id", "period_key");

-- AddForeignKey
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "habit_completions" ADD CONSTRAINT "habit_completions_habit_id_fkey" FOREIGN KEY ("habit_id") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
