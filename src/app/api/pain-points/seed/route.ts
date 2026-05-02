import { NextResponse } from "next/server";

import { LATAM_PAIN_POINT_SEEDS } from "@/lib/pain-points/latam-seed";
import { prisma } from "@/lib/prisma";

export async function POST() {
  let created = 0;
  let skipped = 0;

  for (const seed of LATAM_PAIN_POINT_SEEDS) {
    const existing = await prisma.painPoint.findFirst({
      where: {
        title: seed.title,
        category: seed.category,
      },
      select: { id: true },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.painPoint.create({
      data: {
        title: seed.title,
        category: seed.category,
        description: seed.description,
        evidence: seed.evidence,
        regionCountry: seed.regionCountry,
        severity: seed.severity,
        digitalOpportunity: seed.digitalOpportunity,
        sources: {
          create: {
            sourceName: seed.sourceName,
            sourceUrl: seed.sourceUrl,
            citationText: seed.citationText,
          },
        },
      },
    });

    created += 1;
  }

  return NextResponse.json({
    ok: true,
    created,
    skipped,
    totalSeeds: LATAM_PAIN_POINT_SEEDS.length,
  });
}
