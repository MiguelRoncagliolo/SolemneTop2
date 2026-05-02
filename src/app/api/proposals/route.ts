import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { proposalsStatus } from "@/lib/proposals/runner";

export async function GET() {
  const proposals = await prisma.solutionProposal.findMany({
    where: { status: "active" },
    include: {
      painPoint: {
        select: {
          title: true,
          category: true,
          evidence: true,
        },
      },
      videoSources: {
        include: {
          video: {
            select: {
              title: true,
              url: true,
            },
          },
        },
      },
    },
    orderBy: { fitScore: "desc" },
    take: 20,
  });

  return NextResponse.json({
    status: proposalsStatus(),
    proposals,
  });
}
