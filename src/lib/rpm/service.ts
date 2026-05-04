import { RpmStatus } from "@prisma/client";

import {
  detectVagueRpmStep,
  generateMassiveActionPlan,
  type MassiveActionPlan,
  interpretRpmAnswers,
} from "@/lib/ai/rpm";
import { prisma } from "@/lib/prisma";

export interface RpmAnswersPayload {
  R: Record<string, string>;
  P: Record<string, string>;
  M: Record<string, string>;
}

export interface MassiveActionPlanInput {
  R: Record<string, string>;
  P: Record<string, string>;
  constraints: {
    available_time_per_week: string;
    skills: string;
    capital: string;
    resources: string;
  };
}

function normalizeAnswersPayload(payload: Partial<RpmAnswersPayload>): RpmAnswersPayload {
  return {
    R: payload.R ?? {},
    P: payload.P ?? {},
    M: payload.M ?? {},
  };
}

function planToStepAnswers(plan: MassiveActionPlan): Record<string, string> {
  const byCategory = plan.actions.reduce<Record<string, string[]>>((acc, action) => {
    const current = acc[action.category] ?? [];
    current.push(
      `${action.title} | ${action.description} | impact:${action.impact} | effort:${action.effort} | priority:${action.priority} | timeframe:${action.timeframe}`,
    );
    acc[action.category] = current;
    return acc;
  }, {});

  return {
    generated: "true",
    summary: plan.summary,
    research: (byCategory.research ?? []).join("\n"),
    build: (byCategory.build ?? []).join("\n"),
    sales: (byCategory.sales ?? []).join("\n"),
    validation: (byCategory.validation ?? []).join("\n"),
    learning: (byCategory.learning ?? []).join("\n"),
  };
}

async function markProposalsStale(profileId: string) {
  await prisma.solutionProposal.updateMany({
    where: { rpmProfileId: profileId, status: "active" },
    data: { status: "stale" },
  });
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
    generatedM: profile.generatedM,
    interpretation,
  };
}

export async function saveRpmAnswers(payload: RpmAnswersPayload, runVagueCheck: boolean) {
  const profile = await getOrCreateActiveRpmProfile();
  const normalized = normalizeAnswersPayload(payload);

  await prisma.rpmAnswer.deleteMany({
    where: { rpmProfileId: profile.id },
  });

  const rows = (["R", "P", "M"] as const).flatMap((step) =>
    Object.entries(normalized[step])
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
        R: await detectVagueRpmStep("R", normalized.R),
        P: await detectVagueRpmStep("P", normalized.P),
        M: null,
      }
    : null;

  await prisma.rpmProfile.update({
    where: { id: profile.id },
    data: {
      status: RpmStatus.draft,
      updatedAt: new Date(),
    },
  });

  await markProposalsStale(profile.id);

  return { profileId: profile.id, vagueChecks };
}

export async function generateAndSaveMassiveActionPlan(
  payload: MassiveActionPlanInput,
  replaceExisting = true,
) {
  const profile = await getOrCreateActiveRpmProfile();
  const generatedPlan = await generateMassiveActionPlan(payload);

  const stepAnswers = planToStepAnswers(generatedPlan);

  await prisma.$transaction(async (tx) => {
    await tx.rpmProfile.update({
      where: { id: profile.id },
      data: {
        generatedM: generatedPlan,
        status: RpmStatus.draft,
      },
    });

    if (replaceExisting) {
      await tx.rpmAnswer.deleteMany({
        where: {
          rpmProfileId: profile.id,
          step: "M",
        },
      });
    }

    const mRows = Object.entries(stepAnswers).map(([questionKey, answerText]) => ({
      rpmProfileId: profile.id,
      step: "M",
      questionKey,
      answerText,
    }));

    if (mRows.length > 0) {
      await tx.rpmAnswer.createMany({
        data: mRows,
      });
    }
  });

  await markProposalsStale(profile.id);

  return {
    profileId: profile.id,
    generatedM: generatedPlan,
  };
}

export async function updateGeneratedMassiveActionPlan(plan: MassiveActionPlan) {
  const profile = await getOrCreateActiveRpmProfile();
  const stepAnswers = planToStepAnswers(plan);

  await prisma.$transaction(async (tx) => {
    await tx.rpmProfile.update({
      where: { id: profile.id },
      data: {
        generatedM: plan,
        status: RpmStatus.draft,
      },
    });

    await tx.rpmAnswer.deleteMany({
      where: {
        rpmProfileId: profile.id,
        step: "M",
      },
    });

    await tx.rpmAnswer.createMany({
      data: Object.entries(stepAnswers).map(([questionKey, answerText]) => ({
        rpmProfileId: profile.id,
        step: "M",
        questionKey,
        answerText,
      })),
    });
  });

  await markProposalsStale(profile.id);

  return { profileId: profile.id, generatedM: plan };
}

export async function finalizeRpmProfile(payload: RpmAnswersPayload) {
  const profile = await getOrCreateActiveRpmProfile();
  const normalized = normalizeAnswersPayload(payload);

  const generatedM = profile.generatedM as MassiveActionPlan | null;
  const effectiveM = generatedM ? planToStepAnswers(generatedM) : normalized.M;

  if (!generatedM && Object.keys(effectiveM).length === 0) {
    throw new Error("Massive Action Plan not found. Generate M before finalizing RPM.");
  }

  const interpretation = await interpretRpmAnswers({
    R: normalized.R,
    P: normalized.P,
    M: effectiveM,
  });

  const created = await prisma.rpmAiInterpretation.create({
    data: {
      rpmProfileId: profile.id,
      modelName: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      promptVersion: "rpm.v2.auto-m",
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

  await markProposalsStale(profile.id);

  return created;
}
