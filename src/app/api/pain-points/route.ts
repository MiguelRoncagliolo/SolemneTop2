import { NextResponse } from "next/server";

import { LATAM_PAIN_POINT_SEEDS } from "@/lib/pain-points/latam-seed";
import { painPointInputSchema } from "@/lib/pain-points/schemas";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const painPoints = await prisma.painPoint.findMany({
    include: {
      sources: {
        orderBy: { createdAt: "asc" },
      },
      _count: {
        select: {
          classifications: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    painPoints,
    seedTemplates: LATAM_PAIN_POINT_SEEDS.length,
  });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = painPointInputSchema.parse(payload);

    const created = await prisma.painPoint.create({
      data: {
        title: parsed.title,
        category: parsed.category,
        description: parsed.description,
        evidence: parsed.evidence,
        regionCountry: parsed.regionCountry,
        severity: parsed.severity,
        digitalOpportunity: parsed.digitalOpportunity,
        sources: {
          create: {
            sourceName: parsed.source.sourceName,
            sourceUrl: parsed.source.sourceUrl,
            citationText: parsed.source.citationText,
          },
        },
      },
      include: {
        sources: true,
      },
    });

    return NextResponse.json({ ok: true, painPoint: created }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
