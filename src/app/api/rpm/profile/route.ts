import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRpmProfileWithDetails,
  saveRpmAnswers,
  type RpmAnswersPayload,
} from "@/lib/rpm/service";

const stepAnswersSchema = z.record(z.string(), z.string());
const answersSchema = z.object({
  R: stepAnswersSchema,
  P: stepAnswersSchema,
  M: stepAnswersSchema.optional().default({}),
});

const saveSchema = z.object({
  answers: answersSchema,
  runVagueCheck: z.boolean().default(false),
});

export async function GET() {
  const details = await getRpmProfileWithDetails();
  return NextResponse.json(details);
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = saveSchema.parse(payload);
    const result = await saveRpmAnswers(
      parsed.answers as RpmAnswersPayload,
      parsed.runVagueCheck,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid RPM payload";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
