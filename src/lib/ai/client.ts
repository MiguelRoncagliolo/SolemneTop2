import OpenAI from "openai";

import { getEnv } from "@/lib/env";

const globalForOpenAI = globalThis as unknown as {
  openaiClient?: OpenAI;
};

export function getOpenAiClient(): OpenAI {
  if (globalForOpenAI.openaiClient) {
    return globalForOpenAI.openaiClient;
  }

  const env = getEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required.");
  }

  const client = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForOpenAI.openaiClient = client;
  }

  return client;
}
