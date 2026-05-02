import { z } from "zod";

import { getEnv } from "@/lib/env";

const proposalSchema = z.object({
  title: z.string(),
  pain_point_id: z.string(),
  category: z.string(),
  problem_evidence: z.string(),
  solution: z.string(),
  target_customers: z.string(),
  why_it_works_in_latam: z.string(),
  latam_adaptation: z.string(),
  rpm_alignment: z.string(),
  constraints_considered: z.string(),
  difficulty: z.enum(["low", "medium", "high"]),
  capital_estimate: z.string(),
  required_skills: z.array(z.string()),
  first_mvt_suggestion: z.string(),
  fit_score: z.number().int().min(0).max(100),
  score_breakdown: z.object({
    pain_severity: z.number().int().min(0).max(100),
    rpm_fit: z.number().int().min(0).max(100),
    feasibility: z.number().int().min(0).max(100),
    video_evidence: z.number().int().min(0).max(100),
    tech_reg_complexity: z.number().int().min(0).max(100),
  }),
  video_sources: z.array(
    z.object({
      video_id: z.string(),
      usage_notes: z.string(),
      extracted_model_elements: z.array(z.string()),
    }),
  ),
});

const proposalListSchema = z.object({
  proposals: z.array(proposalSchema).min(4),
});

export type ProposalAiOutput = z.infer<typeof proposalListSchema>;

const proposalJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    proposals: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          pain_point_id: { type: "string" },
          category: { type: "string" },
          problem_evidence: { type: "string" },
          solution: { type: "string" },
          target_customers: { type: "string" },
          why_it_works_in_latam: { type: "string" },
          latam_adaptation: { type: "string" },
          rpm_alignment: { type: "string" },
          constraints_considered: { type: "string" },
          difficulty: { type: "string", enum: ["low", "medium", "high"] },
          capital_estimate: { type: "string" },
          required_skills: { type: "array", items: { type: "string" } },
          first_mvt_suggestion: { type: "string" },
          fit_score: { type: "integer" },
          score_breakdown: {
            type: "object",
            additionalProperties: false,
            properties: {
              pain_severity: { type: "integer" },
              rpm_fit: { type: "integer" },
              feasibility: { type: "integer" },
              video_evidence: { type: "integer" },
              tech_reg_complexity: { type: "integer" },
            },
            required: [
              "pain_severity",
              "rpm_fit",
              "feasibility",
              "video_evidence",
              "tech_reg_complexity",
            ],
          },
          video_sources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                video_id: { type: "string" },
                usage_notes: { type: "string" },
                extracted_model_elements: {
                  type: "array",
                  items: { type: "string" },
                },
              },
              required: ["video_id", "usage_notes", "extracted_model_elements"],
            },
          },
        },
        required: [
          "title",
          "pain_point_id",
          "category",
          "problem_evidence",
          "solution",
          "target_customers",
          "why_it_works_in_latam",
          "latam_adaptation",
          "rpm_alignment",
          "constraints_considered",
          "difficulty",
          "capital_estimate",
          "required_skills",
          "first_mvt_suggestion",
          "fit_score",
          "score_breakdown",
          "video_sources",
        ],
      },
    },
  },
  required: ["proposals"],
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

export async function generateProposalsFromAi(payload: {
  rpmInterpretation: object;
  painPoints: Array<{
    id: string;
    title: string;
    category: string;
    severity: string;
    evidence: string;
    digitalOpportunity: string;
  }>;
  rankedClassifications: Array<{
    painPointId: string;
    painPointTitle: string;
    videoId: string;
    videoTitle: string;
    videoUrl: string;
    relevanceScore: number;
    businessModelConnection: string;
    latamAdaptationNotes: string;
  }>;
}) {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for proposal generation.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You generate practical startup proposals for LATAM and must follow the schema exactly.",
        },
        {
          role: "user",
          content: `Build at least 4 proposals from this data:\n${JSON.stringify(payload, null, 2)}`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "solution_proposals",
          strict: true,
          schema: proposalJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${message}`);
  }

  const result = (await response.json()) as unknown;
  const outputText = extractOutputText(result);
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text.");
  }

  const parsed = proposalListSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    throw new Error(`Invalid proposal output: ${parsed.error.message}`);
  }

  return parsed.data;
}
