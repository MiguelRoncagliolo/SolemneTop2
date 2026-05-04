-- AlterTable
ALTER TABLE "PainPoint"
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'legacy_manual',
ADD COLUMN "generatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "RpmProfile"
ADD COLUMN "generatedM" JSONB;
