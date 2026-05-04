import { NextResponse } from "next/server";

import { painPointUpdateInputSchema } from "@/lib/pain-points/schemas";
import { prisma } from "@/lib/prisma";
import { triggerClassifierRun } from "@/lib/classifier/runner";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;

  try {
    const payload = await request.json();
    const parsed = painPointUpdateInputSchema.parse(payload);

    const updated = await prisma.painPoint.update({
      where: { id },
      data: {
        title: parsed.title,
        category: parsed.category,
        description: parsed.description,
        evidence: parsed.evidence,
        regionCountry: parsed.regionCountry,
        severity: parsed.severity,
        digitalOpportunity: parsed.digitalOpportunity,
        source: "user_edited",
      },
      include: {
        sources: true,
      },
    });

    if (parsed.source && updated.sources[0]) {
      await prisma.painPointSource.update({
        where: { id: updated.sources[0].id },
        data: {
          sourceName: parsed.source.sourceName ?? updated.sources[0].sourceName,
          sourceUrl: parsed.source.sourceUrl ?? updated.sources[0].sourceUrl,
          citationText: parsed.source.citationText ?? updated.sources[0].citationText,
        },
      });
    }

    // Trigger background re-classification when a pain point changes.
    triggerClassifierRun({ painPointId: id, maxPairs: 120 });

    // Mark proposals as stale so users regenerate with updated pain points.
    await prisma.solutionProposal.updateMany({
      where: { status: "active" },
      data: { status: "stale" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  await prisma.painPoint.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
