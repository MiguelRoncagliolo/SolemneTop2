import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [evidenceLinks, interviews, tests] = await Promise.all([
    prisma.evidenceLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.mvtInterview.findMany({
      where: { evidenceLink: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        summary: true,
        evidenceLink: true,
        interviewDate: true,
      },
    }),
    prisma.mvtTest.findMany({
      where: { evidenceLink: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        description: true,
        evidenceLink: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({ evidenceLinks, interviews, tests });
}
