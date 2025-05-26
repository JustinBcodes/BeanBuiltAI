-- AlterTable
ALTER TABLE "NutritionPlan" ALTER COLUMN "endDate" SET DEFAULT NOW() + INTERVAL '30 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentWeight" DOUBLE PRECISION,
ADD COLUMN     "preferredDays" TEXT[],
ADD COLUMN     "sex" TEXT,
ADD COLUMN     "startingWeight" DOUBLE PRECISION,
ADD COLUMN     "targetWeight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "WorkoutPlan" ALTER COLUMN "endDate" SET DEFAULT NOW() + INTERVAL '30 days';
