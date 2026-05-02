import { getEnv } from "../src/lib/env";
import { runScraper } from "../src/lib/scraper/service";
import { runScraperInputSchema } from "../src/lib/scraper/types";

async function main() {
  const env = getEnv();
  const input = runScraperInputSchema.parse({
    channelHandle: process.env.CHANNEL_HANDLE ?? env.STARTER_STORY_HANDLE,
    maxVideos: process.env.MAX_VIDEOS
      ? Number(process.env.MAX_VIDEOS)
      : env.SCRAPER_DEFAULT_MAX_VIDEOS,
    forceTranscriptRefresh: process.env.FORCE_TRANSCRIPT_REFRESH === "true",
  });

  const result = await runScraper(input);
  console.log(JSON.stringify(result, null, 2));

  if (result.status !== "success") {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
