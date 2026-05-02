import { generateSolutionProposals } from "./service";

let running = false;
let lastResult: { createdCount: number } | null = null;
let lastError: string | null = null;

export function proposalsStatus() {
  return { running, lastResult, lastError };
}

export async function triggerProposalGeneration() {
  if (running) {
    return;
  }
  running = true;
  lastError = null;
  try {
    lastResult = await generateSolutionProposals();
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Unknown proposal generation error";
    throw error;
  } finally {
    running = false;
  }
}
