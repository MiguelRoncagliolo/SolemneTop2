import { getEnv } from "@/lib/env";

import {
  painPointClassificationJsonSchema,
  painPointClassificationSchema,
  type PainPointClassificationOutput,
} from "./classifier-schema";

interface ClassifyInput {
  videoTitle: string;
  videoDescription: string;
  videoPublishedAt: string;
  transcript: string;
  painPoint: {
    title: string;
    category: string;
    description: string;
    evidence: string;
    regionCountry: string | null;
    severity: string;
    digitalOpportunity: string;
    sourceCitation: string;
  };
}

function truncateTranscript(text: string, maxChars = 8000): string {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n...[TRUNCATED]`;
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  if (typeof candidate.output_text === "string") {
    return candidate.output_text;
  }

  const output = candidate.output;
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
      const chunkObj = chunk as Record<string, unknown>;
      if (chunkObj.type === "output_text" && typeof chunkObj.text === "string") {
        return chunkObj.text;
      }
    }
  }

  return null;
}

export async function classifyVideoAgainstPainPoint(
  input: ClassifyInput,
): Promise<PainPointClassificationOutput> {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for classification.");
  }

  const systemPrompt =
    "You are a strict LATAM market analyst. Return only schema-compliant JSON.";

  const userPrompt = `
Evaluate if the Starter Story video is relevant for the given LATAM pain point.

Video:
- title: ${input.videoTitle}
- published_at: ${input.videoPublishedAt}
- description: ${input.videoDescription}

Transcript:
${truncateTranscript(input.transcript)}

Pain point:
- title: ${input.painPoint.title}
- category: ${input.painPoint.category}
- description: ${input.painPoint.description}
- evidence: ${input.painPoint.evidence}
- severity: ${input.painPoint.severity}
- region: ${input.painPoint.regionCountry ?? "LatAm"}
- digital_opportunity: ${input.painPoint.digitalOpportunity}
- source_citation: ${input.painPoint.sourceCitation}

Scoring rules:
- relevance_score and confidence_score must be between 0 and 1.
- evidence_from_transcript should include concrete transcript fragments.
- category_match is true only if business context is aligned.
`;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "video_pain_point_classification",
          strict: true,
          schema: painPointClassificationJsonSchema,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as unknown;
  const outputText = extractOutputText(payload);
  if (!outputText) {
    throw new Error("OpenAI response did not include output_text.");
  }

  const parsed = painPointClassificationSchema.safeParse(JSON.parse(outputText));
  if (!parsed.success) {
    throw new Error(`Invalid classification output: ${parsed.error.message}`);
  }

  return parsed.data;
}
