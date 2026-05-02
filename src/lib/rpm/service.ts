import { RpmStatus } from "@prisma/client";

import { detectVagueRpmStep, interpretRpmAnswers } from "@/lib/ai/rpm";
import { prisma } from "@/lib/prisma";

export interface RpmAnswersPayload {
  R: Record<string, string>;
  P: Record<string, string>;
  M: Record<string, string>;
}

export async function getOrCreateActiveRpmProfile() {
  const existing = await prisma.rpmProfile.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.rpmProfile.create({
    data: {
      status: RpmStatus.draft,
      isActive: true,
      version: 1,
    },
  });
}

export async function getRpmProfileWithDetails() {
  const profile = await getOrCreateActiveRpmProfile();
  const [answers, interpretation] = await Promise.all([
    prisma.rpmAnswer.findMany({
      where: { rpmProfileId: profile.id },
      orderBy: [{ step: "asc" }, { questionKey: "asc" }],
    }),
    prisma.rpmAiInterpretation.findFirst({
      where: { rpmProfileId: profile.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const grouped = { R: {} as Record<string, string>, P: {}, M: {} } as RpmAnswersPayload;
  for (const answer of answers) {
    const step = answer.step as "R" | "P" | "M";
    grouped[step][answer.questionKey] = answer.answerText;
  }

  return {
    profile,
    answers: grouped,
    interpretation,
  };
}

export async function saveRpmAnswers(
  payload: RpmAnswersPayload,
  runVagueCheck: boolean,
) {
  const profile = await getOrCreateActiveRpmProfile();

  await prisma.rpmAnswer.deleteMany({
    where: { rpmProfileId: profile.id },
  });

  const rows = (["R", "P", "M"] as const).flatMap((step) =>
    Object.entries(payload[step])
      .filter(([, answer]) => answer.trim().length > 0)
      .map(([questionKey, answerText]) => ({
        rpmProfileId: profile.id,
        step,
        questionKey,
        answerText: answerText.trim(),
      })),
  );

  if (rows.length > 0) {
    await prisma.rpmAnswer.createMany({ data: rows });
  }

  const vagueChecks = runVagueCheck
    ? {
        R: await detectVagueRpmStep("R", payload.R),
        P: await detectVagueRpmStep("P", payload.P),
        M: await detectVagueRpmStep("M", payload.M),
      }
    : null;

  await prisma.rpmProfile.update({
    where: { id: profile.id },
    data: {
      status: RpmStatus.draft,
      updatedAt: new Date(),
    },
  });

  await prisma.solutionProposal.updateMany({
    where: { rpmProfileId: profile.id, status: "active" },
    data: { status: "stale" },
  });

  return { profileId: profile.id, vagueChecks };
}

export async function finalizeRpmProfile(payload: RpmAnswersPayload) {
  const profile = await getOrCreateActiveRpmProfile();

  const interpretation = await interpretRpmAnswers(payload);

  const created = await prisma.rpmAiInterpretation.create({
    data: {
      rpmProfileId: profile.id,
      modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      promptVersion: "rpm.v1",
      structuredJson: interpretation,
      summary: interpretation.summary,
      vaguenessFlags: interpretation.warnings_or_gaps,
    },
  });

  await prisma.rpmProfile.update({
    where: { id: profile.id },
    data: {
      status: RpmStatus.completed,
      version: { increment: 1 },
    },
  });

  await prisma.solutionProposal.updateMany({
    where: { rpmProfileId: profile.id, status: "active" },
    data: { status: "stale" },
  });

  return created;
}
