import { NextResponse } from "next/server";
import { z } from "zod";

import { isScraperRunning, triggerScraperRun } from "@/lib/scraper/runner";

const runRequestSchema = z.object({
  channelHandle: z.string().optional(),
  maxVideos: z.number().int().min(1).max(200).optional(),
  forceTranscriptRefresh: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const parsed = runRequestSchema.parse(payload);

    if (isScraperRunning()) {
      return NextResponse.json(
        {
          ok: false,
          message: "A scraper run is already in progress.",
        },
        { status: 409 },
      );
    }

    await triggerScraperRun(parsed);

    return NextResponse.json(
      {
        ok: true,
        message: "Scraper run started in background.",
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
