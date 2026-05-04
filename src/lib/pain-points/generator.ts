import { Severity } from "@prisma/client";

import { painPointClassificationSchema } from "@/lib/ai/classifier-schema";
import { generatePainPointsFromVideoAnalysesAi } from "@/lib/ai/pain-points";
import { prisma } from "@/lib/prisma";

function inferSeverityFromConfidence(confidence: number): Severity {
  if (confidence >= 0.82) {
    return Severity.critical;
  }
  if (confidence >= 0.68) {
    return Severity.high;
  }
  if (confidence >= 0.52) {
    return Severity.medium;
  }
  return Severity.low;
}

export async function generatePainPointsFromVideos() {
  const analyses = await prisma.videoAiAnalysis.findMany({
    where: { analysisType: "pain_point_classification" },
    include: {
      video: {
        select: {
          id: true,
          url: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  if (analyses.length < 16) {
    throw new Error("Not enough video_ai_analyses. Run classifier first.");
  }

  const topCategoryByVideo = await prisma.videoPainPointClassification.findMany({
    where: {
      relevanceScore: { gte: 0.45 },
    },
    include: {
      painPoint: {
        select: {
          category: true,
        },
      },
    },
    orderBy: [{ relevanceScore: "desc" }, { confidenceScore: "desc" }],
    take: 600,
  });

  const videoCategoryMap = new Map<string, string>();
  for (const row of topCategoryByVideo) {
    if (!videoCategoryMap.has(row.videoId)) {
      videoCategoryMap.set(row.videoId, row.painPoint.category);
    }
  }

  const parsedAnalyses = analyses
    .map((analysis) => {
      const parsed = painPointClassificationSchema.safeParse(analysis.outputJson);
      if (!parsed.success) {
        return null;
      }

      return {
        video_id: analysis.videoId,
        video_url: analysis.video.url,
        video_title: analysis.video.title,
        category_hint: videoCategoryMap.get(analysis.videoId) ?? "productividad pyme",
        relevance_score: parsed.data.relevance_score,
        confidence_score: parsed.data.confidence_score,
        reasoning: parsed.data.reasoning,
        business_model_connection: parsed.data.business_model_connection,
        latam_adaptation_notes: parsed.data.latam_adaptation_notes,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 240);

  if (parsedAnalyses.length < 16) {
    throw new Error("Insufficient valid analysis payloads to generate pain points.");
  }

  const aiOutput = await generatePainPointsFromVideoAnalysesAi({
    analyses: parsedAnalyses,
  });

  const generationTimestamp = new Date();
  const previousActiveAi = await prisma.painPoint.updateMany({
    where: {
      isActive: true,
      source: "ai_generated",
    },
    data: {
      isActive: false,
    },
  });

  const uniqueVideoIds = new Set<string>();
  let createdCount = 0;

  for (const generated of aiOutput.pain_points.slice(0, 12)) {
    for (const evidenceVideo of generated.evidence_videos) {
      uniqueVideoIds.add(evidenceVideo.video_id);
    }

    const evidenceSummary = [
      generated.latam_relevance,
      `Videos: ${generated.evidence_videos.map((video) => `${video.video_id} (${video.video_url})`).join(" | ")}`,
    ].join("\n");

    const created = await prisma.painPoint.create({
      data: {
        title: generated.title,
        category: generated.category,
        description: generated.description,
        evidence: evidenceSummary,
        regionCountry: "LatAm",
        severity: inferSeverityFromConfidence(generated.confidence_score),
        digitalOpportunity: generated.reasoning,
        source: "ai_generated",
        generatedAt: generationTimestamp,
        isActive: true,
        sources: {
          create: {
            sourceName: "AI generated from Starter Story video analyses",
            sourceUrl: "https://www.youtube.com/@starterstory",
            citationText: [
              `Reasoning: ${generated.reasoning}`,
              `Confidence: ${generated.confidence_score.toFixed(2)}`,
              `Evidence videos: ${generated.evidence_videos.map((video) => video.video_url).join(", ")}`,
            ].join("\n"),
          },
        },
      },
      select: { id: true },
    });

    if (created.id) {
      createdCount += 1;
    }
  }

  await prisma.solutionProposal.updateMany({
    where: { status: "active" },
    data: { status: "stale" },
  });

  return {
    generatedCount: createdCount,
    previousActiveAiDisabled: previousActiveAi.count,
    videosUsed: uniqueVideoIds.size,
    generatedAt: generationTimestamp.toISOString(),
  };
}
