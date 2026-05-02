import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const payloadSchema = z.object({
  proposalId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = payloadSchema.parse(payload);

    const existing = await prisma.mvtValidation.findFirst({
      where: { proposalId: parsed.proposalId },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return NextResponse.json({ ok: true, validationId: existing.id, reused: true });
    }

    const validation = await prisma.mvtValidation.create({
      data: {
        proposalId: parsed.proposalId,
        status: "in_progress",
      },
    });

    return NextResponse.json({ ok: true, validationId: validation.id, reused: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
