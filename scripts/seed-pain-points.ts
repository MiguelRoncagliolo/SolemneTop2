import { LATAM_PAIN_POINT_SEEDS } from "../src/lib/pain-points/latam-seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  let created = 0;
  let skipped = 0;

  for (const seed of LATAM_PAIN_POINT_SEEDS) {
    const existing = await prisma.painPoint.findFirst({
      where: { title: seed.title, category: seed.category },
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

  console.log(JSON.stringify({ created, skipped, total: LATAM_PAIN_POINT_SEEDS.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
