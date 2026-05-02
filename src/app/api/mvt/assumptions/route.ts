import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  validationId: z.string().uuid(),
  assumptionText: z.string().min(8),
  riskLevel: z.string().min(2),
  isCritical: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const assumption = await prisma.mvtAssumption.create({
      data: {
        validationId: parsed.validationId,
        assumptionText: parsed.assumptionText,
        riskLevel: parsed.riskLevel,
        isCritical: parsed.isCritical,
      },
    });

    return NextResponse.json({ ok: true, assumption });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid assumption payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
