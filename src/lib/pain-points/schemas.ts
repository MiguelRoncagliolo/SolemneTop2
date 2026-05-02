import { z } from "zod";

export const painPointSourceInputSchema = z.object({
  sourceName: z.string().min(2),
  sourceUrl: z.string().url(),
  citationText: z.string().min(8),
});

export const painPointInputSchema = z.object({
  title: z.string().min(5),
  category: z.string().min(2),
  description: z.string().min(20),
  evidence: z.string().min(20),
  regionCountry: z.string().min(2).default("LatAm"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  digitalOpportunity: z.string().min(20),
  source: painPointSourceInputSchema,
});

export const painPointUpdateInputSchema = painPointInputSchema.partial().extend({
  source: painPointSourceInputSchema.partial().optional(),
});
