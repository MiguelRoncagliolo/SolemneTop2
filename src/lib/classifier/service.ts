import crypto from "node:crypto";

import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { classifyVideoAgainstPainPoint } from "@/lib/ai/openai";

const PROMPT_VERSION = "classifier.v1";

export interface ClassificationRunInput {
  painPointId?: string;
  videoId?: string;
  minTranscriptChars?: number;
  maxPairs?: number;
}

export interface ClassificationRunSummary {
  processedPairs: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: string[];
}

function hashInput(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export async function runPainPointClassification(
  input: ClassificationRunInput,
): Promise<ClassificationRunSummary> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for classification.");
  }

  const minTranscriptChars = input.minTranscriptChars ?? 80;
  const maxPairs = input.maxPairs ?? 250;

  const videos = await prisma.video.findMany({
    where: input.videoId
      ? { id: input.videoId }
      : {},
    include: {
      transcript: true,
    },
    orderBy: { publishedAt: "desc" },
    take: input.videoId ? 1 : 60,
  });

  const painPoints = await prisma.painPoint.findMany({
    where: input.painPointId
      ? { id: input.painPointId, isActive: true }
      : { isActive: true },
    include: {
      sources: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const pairs = [];
  for (const video of videos) {
    if (!video.transcript || video.transcript.transcriptText.length < minTranscriptChars) {
      continue;
    }
    for (const painPoint of painPoints) {
      pairs.push({ video, painPoint });
      if (pairs.length >= maxPairs) {
        break;
      }
    }
    if (pairs.length >= maxPairs) {
      break;
    }
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const pair of pairs) {
    const sourceCitation =
      pair.painPoint.sources[0]?.citationText ??
      `${pair.painPoint.title} (${pair.painPoint.category})`;
    const transcriptText = pair.video.transcript?.transcriptText ?? "";
    const inputFingerprint = hashInput(
      [
        pair.video.id,
        pair.video.updatedAt.toISOString(),
        pair.painPoint.id,
        pair.painPoint.updatedAt.toISOString(),
        transcriptText.slice(0, 1500),
        PROMPT_VERSION,
      ].join("|"),
    );

    try {
      const output = await classifyVideoAgainstPainPoint({
        videoTitle: pair.video.title,
        videoDescription: pair.video.description,
        videoPublishedAt: pair.video.publishedAt.toISOString(),
        transcript: transcriptText,
        painPoint: {
          title: pair.painPoint.title,
          category: pair.painPoint.category,
          description: pair.painPoint.description,
          evidence: pair.painPoint.evidence,
          regionCountry: pair.painPoint.regionCountry,
          severity: pair.painPoint.severity,
          digitalOpportunity: pair.painPoint.digitalOpportunity,
          sourceCitation,
        },
      });

      await prisma.videoAiAnalysis.create({
        data: {
          videoId: pair.video.id,
          analysisType: "pain_point_classification",
          modelProvider: "openai",
          modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
          promptVersion: PROMPT_VERSION,
          inputHash: inputFingerprint,
          outputJson: output,
        },
      });

      const existing = await prisma.videoPainPointClassification.findUnique({
        where: {
          videoId_painPointId: {
            videoId: pair.video.id,
            painPointId: pair.painPoint.id,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await prisma.videoPainPointClassification.update({
          where: {
            videoId_painPointId: {
              videoId: pair.video.id,
              painPointId: pair.painPoint.id,
            },
          },
          data: {
            relevanceScore: output.relevance_score,
            categoryMatch: output.category_match,
            reasoning: output.reasoning,
            businessModelConnection: output.business_model_connection,
            latamAdaptationNotes: output.latam_adaptation_notes,
            confidenceScore: output.confidence_score,
            evidenceFromTranscript: output.evidence_from_transcript,
            modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
            promptVersion: PROMPT_VERSION,
          },
        });
        updated += 1;
      } else {
        await prisma.videoPainPointClassification.create({
          data: {
            videoId: pair.video.id,
            painPointId: pair.painPoint.id,
            relevanceScore: output.relevance_score,
            categoryMatch: output.category_match,
            reasoning: output.reasoning,
            businessModelConnection: output.business_model_connection,
            latamAdaptationNotes: output.latam_adaptation_notes,
            confidenceScore: output.confidence_score,
            evidenceFromTranscript: output.evidence_from_transcript,
            modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
            promptVersion: PROMPT_VERSION,
          },
        });
        created += 1;
      }
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "Unknown classification error";
      errors.push(`${pair.video.youtubeVideoId} x ${pair.painPoint.title}: ${message}`);
    }
  }

  if (pairs.length === 0) {
    skipped = 1;
  }

  return {
    processedPairs: pairs.length,
    created,
    updated,
    skipped,
    failed,
    errors,
  };
}
