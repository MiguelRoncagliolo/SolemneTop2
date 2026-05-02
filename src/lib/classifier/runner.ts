import {
  runPainPointClassification,
  type ClassificationRunInput,
  type ClassificationRunSummary,
} from "./service";

let runningPromise: Promise<ClassificationRunSummary> | null = null;
let lastSummary: ClassificationRunSummary | null = null;
let lastError: string | null = null;
let lastStartedAt: string | null = null;
let lastFinishedAt: string | null = null;

export function isClassifierRunning(): boolean {
  return runningPromise !== null;
}

export function getClassifierStatus() {
  return {
    running: isClassifierRunning(),
    lastSummary,
    lastError,
    lastStartedAt,
    lastFinishedAt,
  };
}

export function triggerClassifierRun(input: ClassificationRunInput): void {
  if (runningPromise) {
    return;
  }

  lastError = null;
  lastStartedAt = new Date().toISOString();
  runningPromise = runPainPointClassification(input)
    .then((summary) => {
      lastSummary = summary;
      return summary;
    })
    .catch((error) => {
      lastError = error instanceof Error ? error.message : "Unknown error";
      throw error;
    })
    .finally(() => {
      lastFinishedAt = new Date().toISOString();
      runningPromise = null;
    });
}
