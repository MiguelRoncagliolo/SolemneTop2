import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  validationId: z.string().uuid(),
  decision: z.enum(["avanzar", "pivotear", "retestear", "descartar"]),
  decisionReasoning: z.string().min(8),
  nextStep: z.string().min(4),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const counts = await prisma.mvtValidation.findUnique({
      where: { id: parsed.validationId },
      select: {
        _count: {
          select: {
            interviews: true,
            assumptions: true,
            tests: true,
          },
        },
      },
    });

    if (!counts) {
      return NextResponse.json({ ok: false, message: "Validation not found." }, { status: 404 });
    }

    if (counts._count.interviews < 5) {
      return NextResponse.json(
        { ok: false, message: "Need at least 5 interviews before final decision." },
        { status: 400 },
      );
    }
    if (counts._count.assumptions < 5) {
      return NextResponse.json(
        { ok: false, message: "Need at least 5 assumptions before final decision." },
        { status: 400 },
      );
    }
    if (counts._count.tests < 1) {
      return NextResponse.json(
        { ok: false, message: "Need at least 1 test before final decision." },
        { status: 400 },
      );
    }

    const validation = await prisma.mvtValidation.update({
      where: { id: parsed.validationId },
      data: {
        decision: parsed.decision,
        decisionReasoning: parsed.decisionReasoning,
        nextStep: parsed.nextStep,
        status: "completed",
      },
    });

    return NextResponse.json({ ok: true, validation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid decision payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
