/*
  Warnings:

  - You are about to drop the column `currentWeight` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `preferredDays` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NutritionPlan" ADD COLUMN     "planName" TEXT,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "currentWeight",
DROP COLUMN "preferredDays",
ADD COLUMN     "preferredWorkoutDays" TEXT[];

-- AlterTable
ALTER TABLE "WorkoutPlan" ADD COLUMN     "planName" TEXT,
ALTER COLUMN "endDate" DROP NOT NULL,
ALTER COLUMN "endDate" DROP DEFAULT;
