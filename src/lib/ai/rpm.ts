import { z } from "zod";

import { getEnv } from "@/lib/env";
import { getOpenAiClient } from "@/lib/ai/client";

const vagueCheckSchema = z.object({
  is_vague: z.boolean(),
  missing_fields: z.array(z.string()),
  follow_up_questions: z.array(z.string()),
  specificity_score: z.number().int().min(0).max(100),
});

const rpmInterpretationSchema = z.object({
  interests: z.array(z.string()),
  constraints: z.array(z.string()),
  available_time_per_week: z.number().int().min(0),
  capital_available: z.string(),
  skills: z.array(z.string()),
  preferred_business_models: z.array(z.string()),
  risk_tolerance: z.enum(["low", "medium", "high"]),
  ambition_level: z.enum(["low", "medium", "high"]),
  geographic_focus: z.array(z.string()),
  impact_goals: z.array(z.string()),
  dealbreakers: z.array(z.string()),
  summary: z.string(),
  warnings_or_gaps: z.array(z.string()),
});

const massiveActionPlanSchema = z.object({
  generated: z.literal(true),
  summary: z.string().min(12),
  actions: z
    .array(
      z.object({
        category: z.enum(["research", "build", "sales", "validation", "learning"]),
        title: z.string().min(4),
        description: z.string().min(12),
        impact: z.string().min(2),
        effort: z.string().min(2),
        priority: z.string().min(2),
        timeframe: z.string().min(2),
      }),
    )
    .min(6),
  warnings_or_gaps: z.array(z.string()),
});

export type RpmInterpretation = z.infer<typeof rpmInterpretationSchema>;
export type VagueCheck = z.infer<typeof vagueCheckSchema>;
export type MassiveActionPlan = z.infer<typeof massiveActionPlanSchema>;

const vagueSchemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_vague: { type: "boolean" },
    missing_fields: { type: "array", items: { type: "string" } },
    follow_up_questions: { type: "array", items: { type: "string" } },
    specificity_score: { type: "integer" },
  },
  required: [
    "is_vague",
    "missing_fields",
    "follow_up_questions",
    "specificity_score",
  ],
} as const;

const interpretationSchemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    interests: { type: "array", items: { type: "string" } },
    constraints: { type: "array", items: { type: "string" } },
    available_time_per_week: { type: "integer" },
    capital_available: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    preferred_business_models: { type: "array", items: { type: "string" } },
    risk_tolerance: { type: "string", enum: ["low", "medium", "high"] },
    ambition_level: { type: "string", enum: ["low", "medium", "high"] },
    geographic_focus: { type: "array", items: { type: "string" } },
    impact_goals: { type: "array", items: { type: "string" } },
    dealbreakers: { type: "array", items: { type: "string" } },
    summary: { type: "string" },
    warnings_or_gaps: { type: "array", items: { type: "string" } },
  },
  required: [
    "interests",
    "constraints",
    "available_time_per_week",
    "capital_available",
    "skills",
    "preferred_business_models",
    "risk_tolerance",
    "ambition_level",
    "geographic_focus",
    "impact_goals",
    "dealbreakers",
    "summary",
    "warnings_or_gaps",
  ],
} as const;

const massiveActionPlanSchemaJson = {
  type: "object",
  additionalProperties: false,
  properties: {
    generated: { type: "boolean", const: true },
    summary: { type: "string" },
    actions: {
      type: "array",
      minItems: 6,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          category: {
            type: "string",
            enum: ["research", "build", "sales", "validation", "learning"],
          },
          title: { type: "string" },
          description: { type: "string" },
          impact: { type: "string" },
          effort: { type: "string" },
          priority: { type: "string" },
          timeframe: { type: "string" },
        },
        required: [
          "category",
          "title",
          "description",
          "impact",
          "effort",
          "priority",
          "timeframe",
        ],
      },
    },
    warnings_or_gaps: { type: "array", items: { type: "string" } },
  },
  required: ["generated", "summary", "actions", "warnings_or_gaps"],
} as const;

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const objectPayload = payload as Record<string, unknown>;
  if (typeof objectPayload.output_text === "string") {
    return objectPayload.output_text;
  }

  const output = objectPayload.output;
  if (!Array.isArray(output)) {
    return null;
  }

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const chunk of content) {
      if (!chunk || typeof chunk !== "object") {
        continue;
      }
      const node = chunk as Record<string, unknown>;
      if (node.type === "output_text" && typeof node.text === "string") {
        return node.text;
      }
    }
  }

  return null;
}

async function callStructuredOutput<T>({
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
  parser,
}: {
  schemaName: string;
  schema: Record<string, unknown>;
  systemPrompt: string;
  userPrompt: string;
  parser: z.ZodSchema<T>;
}) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for RPM AI processing.");
  }
  const client = getOpenAiClient();
  const payload = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });
  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text.");
  }

  const parsed = parser.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    throw new Error(`Invalid RPM structured output: ${parsed.error.message}`);
  }
  return parsed.data;
}

export async function detectVagueRpmStep(
  step: "R" | "P" | "M",
  answers: Record<string, string>,
): Promise<VagueCheck> {
  return callStructuredOutput({
    schemaName: "rpm_vagueness_check",
    schema: vagueSchemaJson,
    parser: vagueCheckSchema,
    systemPrompt:
      "You are an RPM coach. Judge if the step answers are too vague to drive action.",
    userPrompt: `RPM step ${step}. Answers JSON:\n${JSON.stringify(answers, null, 2)}`,
  });
}

export async function interpretRpmAnswers(
  rpmAnswers: {
    R: Record<string, string>;
    P: Record<string, string>;
    M: Record<string, string>;
  },
): Promise<RpmInterpretation> {
  return callStructuredOutput({
    schemaName: "rpm_interpretation",
    schema: interpretationSchemaJson,
    parser: rpmInterpretationSchema,
    systemPrompt:
      "Transform RPM answers into a practical entrepreneurial profile. Be concrete and avoid generic advice.",
    userPrompt: `RPM answers JSON:\n${JSON.stringify(rpmAnswers, null, 2)}`,
  });
}

export async function generateMassiveActionPlan(profile: {
  R: Record<string, string>;
  P: Record<string, string>;
  constraints: {
    available_time_per_week: string;
    skills: string;
    capital: string;
    resources: string;
  };
}): Promise<MassiveActionPlan> {
  return callStructuredOutput({
    schemaName: "rpm_massive_action_plan",
    schema: massiveActionPlanSchemaJson,
    parser: massiveActionPlanSchema,
    systemPrompt:
      "You are a LATAM startup execution coach. Build a concrete Massive Action Plan grouped into actionable categories.",
    userPrompt: `Generate a Massive Action Plan from this profile JSON:\n${JSON.stringify(profile, null, 2)}`,
  });
}
