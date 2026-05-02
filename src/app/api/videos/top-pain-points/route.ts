import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { publishedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      url: true,
      classifications: {
        orderBy: { relevanceScore: "desc" },
        take: 3,
        include: {
          painPoint: {
            select: {
              id: true,
              title: true,
              category: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ videos });
}
