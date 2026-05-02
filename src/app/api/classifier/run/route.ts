import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getClassifierStatus,
  isClassifierRunning,
  triggerClassifierRun,
} from "@/lib/classifier/runner";

const classifierInputSchema = z.object({
  painPointId: z.string().uuid().optional(),
  videoId: z.string().uuid().optional(),
  minTranscriptChars: z.number().int().min(20).max(1000).optional(),
  maxPairs: z.number().int().min(1).max(500).optional(),
});

export async function GET() {
  return NextResponse.json(getClassifierStatus());
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));
    const parsed = classifierInputSchema.parse(payload);

    if (isClassifierRunning()) {
      return NextResponse.json(
        { ok: false, message: "Classifier is already running." },
        { status: 409 },
      );
    }

    triggerClassifierRun(parsed);

    return NextResponse.json(
      { ok: true, message: "Classification started in background." },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
