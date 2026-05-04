import { z } from "zod";

import { getEnv } from "@/lib/env";
import { getOpenAiClient } from "@/lib/ai/client";

const generatedPainPointSchema = z.object({
  title: z.string().min(6),
  description: z.string().min(30),
  category: z.string().min(2),
  latam_relevance: z.string().min(20),
  evidence_videos: z
    .array(
      z.object({
        video_id: z.string().min(1),
        video_url: z.string().url(),
      }),
    )
    .min(1),
  reasoning: z.string().min(20),
  confidence_score: z.number().min(0).max(1),
});

const generatedPainPointListSchema = z.object({
  pain_points: z.array(generatedPainPointSchema).min(8),
});

export type GeneratedPainPointList = z.infer<typeof generatedPainPointListSchema>;

const generatedPainPointJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pain_points: {
      type: "array",
      minItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          category: { type: "string" },
          latam_relevance: { type: "string" },
          evidence_videos: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                video_id: { type: "string" },
                video_url: { type: "string", format: "uri" },
              },
              required: ["video_id", "video_url"],
            },
          },
          reasoning: { type: "string" },
          confidence_score: { type: "number" },
        },
        required: [
          "title",
          "description",
          "category",
          "latam_relevance",
          "evidence_videos",
          "reasoning",
          "confidence_score",
        ],
      },
    },
  },
  required: ["pain_points"],
} as const;

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const data = payload as Record<string, unknown>;
  if (typeof data.output_text === "string") {
    return data.output_text;
  }
  const output = data.output;
  if (!Array.isArray(output)) {
    return null;
  }
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const chunk of content) {
      if (!chunk || typeof chunk !== "object") continue;
      const node = chunk as Record<string, unknown>;
      if (node.type === "output_text" && typeof node.text === "string") {
        return node.text;
      }
    }
  }
  return null;
}

export async function generatePainPointsFromVideoAnalysesAi(payload: {
  analyses: Array<{
    video_id: string;
    video_url: string;
    video_title: string;
    category_hint: string;
    relevance_score: number;
    confidence_score: number;
    reasoning: string;
    business_model_connection: string;
    latam_adaptation_notes: string;
  }>;
}) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for automatic pain point generation.");
  }

  const client = getOpenAiClient();
  const result = await client.responses.create({
    model: env.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content:
          "You are a LATAM market intelligence analyst. Detect recurring problems from startup video analyses and return only schema-compliant JSON.",
      },
      {
        role: "user",
        content: `Generate at least 8 pain points from these analyses. Keep them concrete, non-duplicated, and focused on LATAM opportunities.\n\nAnalyses JSON:\n${JSON.stringify(payload, null, 2)}`,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generated_latam_pain_points",
        strict: true,
        schema: generatedPainPointJsonSchema,
      },
    },
  });

  const outputText = extractOutputText(result);
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text for pain point generation.");
  }

  const parsed = generatedPainPointListSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    throw new Error(`Invalid generated pain points output: ${parsed.error.message}`);
  }

  return parsed.data;
}
