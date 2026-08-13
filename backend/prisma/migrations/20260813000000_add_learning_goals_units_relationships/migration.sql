-- CreateEnum
CREATE TYPE "LearningUnitStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REOPENED');

-- CreateTable
CREATE TABLE "learning_goals" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "learning_units" (
    "id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "LearningUnitStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learning_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_learning_units" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_learning_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_learning_goals" (
    "id" TEXT NOT NULL,
    "resource_id" TEXT NOT NULL,
    "goal_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "resource_learning_goals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_learning_units_resource_id_unit_id_key" ON "resource_learning_units"("resource_id", "unit_id");
CREATE UNIQUE INDEX "resource_learning_goals_resource_id_goal_id_key" ON "resource_learning_goals"("resource_id", "goal_id");

-- AddForeignKey
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_units" ADD CONSTRAINT "learning_units_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_units" ADD CONSTRAINT "learning_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_learning_units" ADD CONSTRAINT "resource_learning_units_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_learning_units" ADD CONSTRAINT "resource_learning_units_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "learning_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_learning_units" ADD CONSTRAINT "resource_learning_units_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_learning_goals" ADD CONSTRAINT "resource_learning_goals_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_learning_goals" ADD CONSTRAINT "resource_learning_goals_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "resource_learning_goals" ADD CONSTRAINT "resource_learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
