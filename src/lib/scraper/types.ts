import { z } from "zod";

export const runScraperInputSchema = z.object({
  channelHandle: z.string().default("@starterstory"),
  maxVideos: z.number().int().min(1).max(200).default(30),
  forceTranscriptRefresh: z.boolean().default(false),
});

export type RunScraperInput = z.infer<typeof runScraperInputSchema>;

export interface ScraperRunSummary {
  runId: string;
  status: "success" | "failed";
  startTime: string;
  endTime: string;
  videosFound: number;
  videosCreated: number;
  videosUpdated: number;
  errors: string[];
  durationMs: number;
}
