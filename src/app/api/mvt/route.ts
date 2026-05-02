import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [proposals, validations] = await Promise.all([
    prisma.solutionProposal.findMany({
      where: { status: { in: ["active", "stale"] } },
      select: {
        id: true,
        title: true,
        fitScore: true,
        category: true,
        painPoint: { select: { title: true } },
      },
      orderBy: { fitScore: "desc" },
      take: 20,
    }),
    prisma.mvtValidation.findMany({
      include: {
        proposal: {
          select: { title: true },
        },
        _count: {
          select: {
            interviews: true,
            assumptions: true,
            tests: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  return NextResponse.json({ proposals, validations });
}
