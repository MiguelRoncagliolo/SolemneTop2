import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  testId: z.string().uuid(),
  targetMetric: z.string().min(1),
  actualMetric: z.string().min(1),
  conclusion: z.enum(["validated", "invalidated", "inconclusive"]),
  analysis: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const result = await prisma.mvtResult.create({
      data: {
        testId: parsed.testId,
        targetMetric: parsed.targetMetric,
        actualMetric: parsed.actualMetric,
        conclusion: parsed.conclusion,
        analysis: parsed.analysis,
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid result payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
