import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  validationId: z.string().uuid(),
  contactAlias: z.string().min(2),
  channel: z.string().min(2),
  interviewDate: z.string(),
  summary: z.string().min(8),
  currentProblem: z.string().min(8),
  currentSolution: z.string().min(8),
  painIntensity: z.number().int().min(1).max(10),
  willingnessToPay: z.string().min(2),
  evidenceLink: z.string().url().optional(),
  evidenceFilePath: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const interview = await prisma.mvtInterview.create({
      data: {
        validationId: parsed.validationId,
        contactAlias: parsed.contactAlias,
        channel: parsed.channel,
        interviewDate: new Date(parsed.interviewDate),
        summary: parsed.summary,
        currentProblem: parsed.currentProblem,
        currentSolution: parsed.currentSolution,
        painIntensity: parsed.painIntensity,
        willingnessToPay: parsed.willingnessToPay,
        evidenceLink: parsed.evidenceLink,
        evidenceFilePath: parsed.evidenceFilePath,
      },
    });

    if (parsed.evidenceLink) {
      await prisma.evidenceLink.create({
        data: {
          entityType: "mvt_interview",
          entityId: interview.id,
          label: "interview_evidence",
          url: parsed.evidenceLink,
        },
      });
    }

    return NextResponse.json({ ok: true, interview });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid interview payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
