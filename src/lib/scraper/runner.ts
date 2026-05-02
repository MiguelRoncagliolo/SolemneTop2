import { getEnv } from "@/lib/env";

import { runScraper } from "./service";
import { runScraperInputSchema } from "./types";

let inFlightPromise: Promise<unknown> | null = null;

export function isScraperRunning(): boolean {
  return inFlightPromise !== null;
}

export function triggerScraperRun(
  partialInput?: Partial<{ channelHandle: string; maxVideos: number; forceTranscriptRefresh: boolean }>,
): Promise<void> {
  if (inFlightPromise) {
    return Promise.resolve();
  }

  const env = getEnv();
  const input = runScraperInputSchema.parse({
    channelHandle: partialInput?.channelHandle ?? env.STARTER_STORY_HANDLE,
    maxVideos: partialInput?.maxVideos ?? env.SCRAPER_DEFAULT_MAX_VIDEOS,
    forceTranscriptRefresh: partialInput?.forceTranscriptRefresh ?? false,
  });

  inFlightPromise = runScraper(input)
    .catch((error) => {
      console.error("Scraper run failed", error);
    })
    .finally(() => {
      inFlightPromise = null;
    });

  return Promise.resolve();
}
