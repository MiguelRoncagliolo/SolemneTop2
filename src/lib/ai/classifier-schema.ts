import { z } from "zod";

export const painPointClassificationSchema = z.object({
  relevance_score: z.number().min(0).max(1),
  category_match: z.boolean(),
  reasoning: z.string().min(8),
  business_model_connection: z.string().min(8),
  latam_adaptation_notes: z.string().min(8),
  confidence_score: z.number().min(0).max(1),
  evidence_from_transcript: z.array(z.string().min(1)).min(1),
});

export type PainPointClassificationOutput = z.infer<
  typeof painPointClassificationSchema
>;

export const painPointClassificationJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    relevance_score: { type: "number" },
    category_match: { type: "boolean" },
    reasoning: { type: "string" },
    business_model_connection: { type: "string" },
    latam_adaptation_notes: { type: "string" },
    confidence_score: { type: "number" },
    evidence_from_transcript: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
    },
  },
  required: [
    "relevance_score",
    "category_match",
    "reasoning",
    "business_model_connection",
    "latam_adaptation_notes",
    "confidence_score",
    "evidence_from_transcript",
  ],
} as const;
