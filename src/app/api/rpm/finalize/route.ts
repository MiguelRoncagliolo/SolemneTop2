import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizeRpmProfile, type RpmAnswersPayload } from "@/lib/rpm/service";

const stepAnswersSchema = z.record(z.string(), z.string());
const answersSchema = z.object({
  R: stepAnswersSchema,
  P: stepAnswersSchema,
  M: stepAnswersSchema.optional().default({}),
});

const finalizeSchema = z.object({
  answers: answersSchema,
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = finalizeSchema.parse(payload);
    const interpretation = await finalizeRpmProfile(parsed.answers as RpmAnswersPayload);
    return NextResponse.json({ ok: true, interpretation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid RPM finalization payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
