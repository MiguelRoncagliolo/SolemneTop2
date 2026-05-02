import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

function toNumber(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const painPointId = searchParams.get("painPointId");
  const category = searchParams.get("category");
  const minRelevance = toNumber(searchParams.get("minRelevance"), 0.5);
  const take = Math.min(toNumber(searchParams.get("take"), 200), 400);

  const classifications = await prisma.videoPainPointClassification.findMany({
    where: {
      painPointId: painPointId || undefined,
      relevanceScore: { gte: minRelevance },
      painPoint: category ? { category } : undefined,
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          url: true,
          publishedAt: true,
        },
      },
      painPoint: {
        select: {
          id: true,
          title: true,
          category: true,
          severity: true,
        },
      },
    },
    orderBy: [{ relevanceScore: "desc" }, { updatedAt: "desc" }],
    take,
  });

  return NextResponse.json({ classifications });
}
