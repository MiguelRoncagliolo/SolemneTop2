import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generateAndSaveMassiveActionPlan,
  updateGeneratedMassiveActionPlan,
} from "@/lib/rpm/service";

const stepAnswersSchema = z.record(z.string(), z.string());

const generateSchema = z.object({
  R: stepAnswersSchema,
  P: stepAnswersSchema,
  constraints: z.object({
    available_time_per_week: z.string().min(1),
    skills: z.string().min(1),
    capital: z.string().min(1),
    resources: z.string().min(1),
  }),
});

const planActionSchema = z.object({
  category: z.enum(["research", "build", "sales", "validation", "learning"]),
  title: z.string().min(1),
  description: z.string().min(1),
  impact: z.string().min(1),
  effort: z.string().min(1),
  priority: z.string().min(1),
  timeframe: z.string().min(1),
});

const planSchema = z.object({
  generated: z.boolean(),
  summary: z.string(),
  actions: z.array(planActionSchema).min(1),
  warnings_or_gaps: z.array(z.string()),
});

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = generateSchema.parse(payload);
    const result = await generateAndSaveMassiveActionPlan(parsed, true);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Massive Action Plan generation failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json();
    const parsed = planSchema.parse(payload);
    const result = await updateGeneratedMassiveActionPlan({
      ...parsed,
      generated: true,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Massive Action Plan update failed.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
