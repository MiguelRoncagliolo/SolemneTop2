-- CreateEnum
CREATE TYPE "ScraperRunStatus" AS ENUM ('running', 'success', 'failed');

-- CreateEnum
CREATE TYPE "ScraperScheduleType" AS ENUM ('interval', 'daily', 'weekly', 'paused');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "RpmStatus" AS ENUM ('draft', 'completed');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "MvtConclusion" AS ENUM ('validated', 'invalidated', 'inconclusive');

-- CreateEnum
CREATE TYPE "MvtDecision" AS ENUM ('avanzar', 'pivotear', 'retestear', 'descartar');

-- CreateTable
CREATE TABLE "Channel" (
    "id" TEXT NOT NULL,
    "youtubeChannelId" TEXT NOT NULL,
    "handle" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "youtubeVideoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "durationSec" INTEGER,
    "viewCount" BIGINT,
    "likeCount" BIGINT,
    "commentCount" BIGINT,
    "tags" TEXT[],
    "rawMetadata" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMetricsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoMetricSnapshot" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" BIGINT,
    "likeCount" BIGINT,
    "commentCount" BIGINT,
    "rawMetrics" JSONB NOT NULL,

    CONSTRAINT "VideoMetricSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "transcriptText" TEXT NOT NULL,
    "languageCode" TEXT,
    "transcriptSource" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qualityScore" DOUBLE PRECISION,
    "rawTranscript" JSONB,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperRun" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "status" "ScraperRunStatus" NOT NULL,
    "videosFound" INTEGER NOT NULL DEFAULT 0,
    "videosCreated" INTEGER NOT NULL DEFAULT 0,
    "videosUpdated" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsJson" JSONB,
    "durationMs" INTEGER,
    "triggerRunId" TEXT,

    CONSTRAINT "ScraperRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScraperSetting" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "scheduleType" "ScraperScheduleType" NOT NULL DEFAULT 'paused',
    "intervalHours" INTEGER,
    "dailyTime" TEXT,
    "weeklyDay" INTEGER,
    "weeklyTime" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Santiago',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScraperSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PainPoint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "regionCountry" TEXT,
    "severity" "Severity" NOT NULL,
    "digitalOpportunity" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PainPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PainPointSource" (
    "id" TEXT NOT NULL,
    "painPointId" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "citationText" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PainPointSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAiAnalysis" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "analysisType" TEXT NOT NULL,
    "modelProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputHash" TEXT NOT NULL,
    "outputJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoAiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoPainPointClassification" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "painPointId" TEXT NOT NULL,
    "relevanceScore" DOUBLE PRECISION NOT NULL,
    "categoryMatch" BOOLEAN NOT NULL,
    "reasoning" TEXT NOT NULL,
    "businessModelConnection" TEXT NOT NULL,
    "latamAdaptationNotes" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "evidenceFromTranscript" TEXT[],
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoPainPointClassification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpmProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "status" "RpmStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RpmProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpmAnswer" (
    "id" TEXT NOT NULL,
    "rpmProfileId" TEXT NOT NULL,
    "step" TEXT NOT NULL,
    "questionKey" TEXT NOT NULL,
    "answerText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RpmAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RpmAiInterpretation" (
    "id" TEXT NOT NULL,
    "rpmProfileId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "structuredJson" JSONB NOT NULL,
    "vaguenessFlags" JSONB,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RpmAiInterpretation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolutionProposal" (
    "id" TEXT NOT NULL,
    "rpmProfileId" TEXT NOT NULL,
    "painPointId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "problemEvidence" TEXT NOT NULL,
    "proposedSolution" TEXT NOT NULL,
    "targetCustomers" TEXT NOT NULL,
    "latamFitReason" TEXT NOT NULL,
    "latamAdaptation" TEXT NOT NULL,
    "rpmAlignment" TEXT NOT NULL,
    "constraintsConsidered" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "capitalEstimate" TEXT NOT NULL,
    "requiredSkills" TEXT[],
    "firstMvtSuggestion" TEXT NOT NULL,
    "fitScore" INTEGER NOT NULL,
    "scoreBreakdown" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolutionProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalVideoSource" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "usageNotes" TEXT NOT NULL,
    "extractedModelElements" JSONB,

    CONSTRAINT "ProposalVideoSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvtValidation" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "decision" "MvtDecision",
    "decisionReasoning" TEXT,
    "nextStep" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MvtValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvtInterview" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "contactAlias" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "interviewDate" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "currentProblem" TEXT NOT NULL,
    "currentSolution" TEXT NOT NULL,
    "painIntensity" INTEGER NOT NULL,
    "willingnessToPay" TEXT NOT NULL,
    "evidenceLink" TEXT,
    "evidenceFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MvtInterview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvtAssumption" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "assumptionText" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MvtAssumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvtTest" (
    "id" TEXT NOT NULL,
    "validationId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metricDefinition" TEXT NOT NULL,
    "targetValue" TEXT NOT NULL,
    "evidenceLink" TEXT,
    "evidenceFilePath" TEXT,
    "executedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MvtTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvtResult" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "targetMetric" TEXT NOT NULL,
    "actualMetric" TEXT NOT NULL,
    "conclusion" "MvtConclusion" NOT NULL,
    "analysis" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MvtResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceLink" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Channel_youtubeChannelId_key" ON "Channel"("youtubeChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_youtubeVideoId_key" ON "Video"("youtubeVideoId");

-- CreateIndex
CREATE INDEX "VideoMetricSnapshot_videoId_capturedAt_idx" ON "VideoMetricSnapshot"("videoId", "capturedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Transcript_videoId_key" ON "Transcript"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "ScraperSetting_channelId_key" ON "ScraperSetting"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoPainPointClassification_videoId_painPointId_key" ON "VideoPainPointClassification"("videoId", "painPointId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMetricSnapshot" ADD CONSTRAINT "VideoMetricSnapshot_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScraperRun" ADD CONSTRAINT "ScraperRun_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScraperSetting" ADD CONSTRAINT "ScraperSetting_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PainPointSource" ADD CONSTRAINT "PainPointSource_painPointId_fkey" FOREIGN KEY ("painPointId") REFERENCES "PainPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoAiAnalysis" ADD CONSTRAINT "VideoAiAnalysis_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPainPointClassification" ADD CONSTRAINT "VideoPainPointClassification_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoPainPointClassification" ADD CONSTRAINT "VideoPainPointClassification_painPointId_fkey" FOREIGN KEY ("painPointId") REFERENCES "PainPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpmAnswer" ADD CONSTRAINT "RpmAnswer_rpmProfileId_fkey" FOREIGN KEY ("rpmProfileId") REFERENCES "RpmProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RpmAiInterpretation" ADD CONSTRAINT "RpmAiInterpretation_rpmProfileId_fkey" FOREIGN KEY ("rpmProfileId") REFERENCES "RpmProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionProposal" ADD CONSTRAINT "SolutionProposal_rpmProfileId_fkey" FOREIGN KEY ("rpmProfileId") REFERENCES "RpmProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolutionProposal" ADD CONSTRAINT "SolutionProposal_painPointId_fkey" FOREIGN KEY ("painPointId") REFERENCES "PainPoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVideoSource" ADD CONSTRAINT "ProposalVideoSource_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "SolutionProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalVideoSource" ADD CONSTRAINT "ProposalVideoSource_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvtValidation" ADD CONSTRAINT "MvtValidation_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "SolutionProposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvtInterview" ADD CONSTRAINT "MvtInterview_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "MvtValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvtAssumption" ADD CONSTRAINT "MvtAssumption_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "MvtValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvtTest" ADD CONSTRAINT "MvtTest_validationId_fkey" FOREIGN KEY ("validationId") REFERENCES "MvtValidation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvtResult" ADD CONSTRAINT "MvtResult_testId_fkey" FOREIGN KEY ("testId") REFERENCES "MvtTest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

