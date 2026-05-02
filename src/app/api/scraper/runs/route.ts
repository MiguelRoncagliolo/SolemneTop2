import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isScraperRunning } from "@/lib/scraper/runner";

export async function GET() {
  const runs = await prisma.scraperRun.findMany({
    orderBy: { startTime: "desc" },
    take: 20,
    include: {
      channel: {
        select: {
          title: true,
          youtubeChannelId: true,
        },
      },
    },
  });

  return NextResponse.json({
    runningInMemory: isScraperRunning(),
    runs,
  });
}
