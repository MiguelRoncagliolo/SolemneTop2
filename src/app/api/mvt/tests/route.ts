import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  validationId: z.string().uuid(),
  testType: z.string().min(2),
  description: z.string().min(8),
  metricDefinition: z.string().min(4),
  targetValue: z.string().min(1),
  evidenceLink: z.string().url().optional(),
  evidenceFilePath: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const test = await prisma.mvtTest.create({
      data: {
        validationId: parsed.validationId,
        testType: parsed.testType,
        description: parsed.description,
        metricDefinition: parsed.metricDefinition,
        targetValue: parsed.targetValue,
        evidenceLink: parsed.evidenceLink,
        evidenceFilePath: parsed.evidenceFilePath,
        executedAt: new Date(),
      },
    });

    if (parsed.evidenceLink) {
      await prisma.evidenceLink.create({
        data: {
          entityType: "mvt_test",
          entityId: test.id,
          label: "test_evidence",
          url: parsed.evidenceLink,
        },
      });
    }

    return NextResponse.json({ ok: true, test });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid test payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
