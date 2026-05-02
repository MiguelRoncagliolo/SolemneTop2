import { prisma } from "../src/lib/prisma";
import { shouldRunBySetting } from "../src/lib/scraper/schedule";
import { runScraper } from "../src/lib/scraper/service";
import { runScraperInputSchema } from "../src/lib/scraper/types";

async function main() {
  const channels = await prisma.channel.findMany({
    include: {
      scraperSetting: true,
    },
  });

  if (!channels.length) {
    console.log("No channels registered. Scheduler exiting.");
    return;
  }

  for (const channel of channels) {
    if (!channel.scraperSetting) {
      console.log(`Channel ${channel.youtubeChannelId} has no settings, skipping.`);
      continue;
    }

    const lastRun = await prisma.scraperRun.findFirst({
      where: { channelId: channel.id },
      orderBy: { startTime: "desc" },
    });

    if (!shouldRunBySetting(channel.scraperSetting, lastRun)) {
      console.log(`Schedule not due for ${channel.youtubeChannelId}.`);
      continue;
    }

    const input = runScraperInputSchema.parse({
      channelHandle: channel.handle ?? `@${channel.youtubeChannelId}`,
      maxVideos: 30,
      forceTranscriptRefresh: false,
    });

    const result = await runScraper(input);
    console.log(
      `Scheduled run for ${channel.youtubeChannelId}: ${result.status} (${result.videosFound} found)`,
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
