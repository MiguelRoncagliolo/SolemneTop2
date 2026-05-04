import { NextResponse } from "next/server";

import { triggerClassifierRun } from "@/lib/classifier/runner";
import { generatePainPointsFromVideos } from "@/lib/pain-points/generator";

export async function POST() {
  try {
    const result = await generatePainPointsFromVideos();

    // Re-classify all active videos against the new/generated pain points.
    triggerClassifierRun({ maxPairs: 400 });

    return NextResponse.json({
      ok: true,
      ...result,
      reclassificationTriggered: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pain point generation failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
