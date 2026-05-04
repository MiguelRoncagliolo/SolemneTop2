import { Prisma } from "@prisma/client";

import { generateProposalsFromAi } from "@/lib/ai/proposals";
import { prisma } from "@/lib/prisma";

export async function generateSolutionProposals() {
  const rpmProfile = await prisma.rpmProfile.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!rpmProfile) {
    throw new Error("No active RPM profile found.");
  }

  const rpmInterpretation = await prisma.rpmAiInterpretation.findFirst({
    where: { rpmProfileId: rpmProfile.id },
    orderBy: { createdAt: "desc" },
  });

  if (!rpmInterpretation) {
    throw new Error("RPM interpretation not found. Complete RPM wizard first.");
  }
  if (!rpmProfile.generatedM) {
    throw new Error("Generated Massive Action Plan not found. Generate M first.");
  }

  const painPoints = await prisma.painPoint.findMany({
    where: { isActive: true },
    orderBy: [{ severity: "desc" }, { updatedAt: "desc" }],
  });
  if (painPoints.length < 4) {
    throw new Error("At least 4 active pain points are required.");
  }

  const classifications = await prisma.videoPainPointClassification.findMany({
    where: { relevanceScore: { gte: 0.45 } },
    include: {
      painPoint: true,
      video: true,
    },
    orderBy: [{ relevanceScore: "desc" }, { confidenceScore: "desc" }],
    take: 200,
  });

  const aiPayload = {
    rpmInterpretation: rpmInterpretation.structuredJson as Prisma.JsonObject,
    generatedMassiveActionPlan: rpmProfile.generatedM as Prisma.JsonObject,
    painPoints: painPoints.map((point) => ({
      id: point.id,
      title: point.title,
      category: point.category,
      severity: point.severity,
      evidence: point.evidence,
      digitalOpportunity: point.digitalOpportunity,
      source: point.source,
      generatedAt: point.generatedAt?.toISOString() ?? null,
    })),
    rankedClassifications: classifications.map((item) => ({
      painPointId: item.painPointId,
      painPointTitle: item.painPoint.title,
      videoId: item.videoId,
      videoTitle: item.video.title,
      videoUrl: item.video.url,
      relevanceScore: item.relevanceScore,
      businessModelConnection: item.businessModelConnection,
      latamAdaptationNotes: item.latamAdaptationNotes,
    })),
  };

  const aiResponse = await generateProposalsFromAi(aiPayload);

  await prisma.solutionProposal.updateMany({
    where: { rpmProfileId: rpmProfile.id, status: "active" },
    data: { status: "archived" },
  });

  const createdIds: string[] = [];

  for (const proposal of aiResponse.proposals.slice(0, 8)) {
    const created = await prisma.solutionProposal.create({
      data: {
        rpmProfileId: rpmProfile.id,
        painPointId: proposal.pain_point_id,
        title: proposal.title,
        category: proposal.category,
        problemEvidence: proposal.problem_evidence,
        proposedSolution: proposal.solution,
        targetCustomers: proposal.target_customers,
        latamFitReason: proposal.why_it_works_in_latam,
        latamAdaptation: proposal.latam_adaptation,
        rpmAlignment: proposal.rpm_alignment,
        constraintsConsidered: proposal.constraints_considered,
        difficulty: proposal.difficulty,
        capitalEstimate: proposal.capital_estimate,
        requiredSkills: proposal.required_skills,
        firstMvtSuggestion: proposal.first_mvt_suggestion,
        fitScore: proposal.fit_score,
        scoreBreakdown: proposal.score_breakdown,
        status: "active",
      },
    });
    createdIds.push(created.id);

    const validVideoSources = proposal.video_sources.filter((source) =>
      classifications.some((item) => item.videoId === source.video_id),
    );

    if (validVideoSources.length > 0) {
      await prisma.proposalVideoSource.createMany({
        data: validVideoSources.map((source) => ({
          proposalId: created.id,
          videoId: source.video_id,
          usageNotes: source.usage_notes,
          extractedModelElements: source.extracted_model_elements,
        })),
      });
    }
  }

  return { createdCount: createdIds.length };
}
