import { Prisma, ScraperRunStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  getYoutubeClient,
  listUploadsVideoIds,
  resolveChannelByHandle,
} from "@/lib/youtube/client";
import { parseIsoDurationToSeconds } from "@/lib/youtube/parse";
import { fetchTranscriptForVideo } from "@/lib/youtube/transcript";

import type { RunScraperInput, ScraperRunSummary } from "./types";

function toBigIntOrNull(value: string | number | null | undefined): bigint | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return BigInt(Math.trunc(parsed));
}

function chunkArray<T>(items: T[], size: number): T[][]
{
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function toInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

export async function runScraper(input: RunScraperInput): Promise<ScraperRunSummary> {
  const start = Date.now();
  const startedAt = new Date();
  const errors: string[] = [];
  let videosCreated = 0;
  let videosUpdated = 0;
  let videosFound = 0;

  const channel = await resolveChannelByHandle(input.channelHandle);
  const dbChannel = await prisma.channel.upsert({
    where: { youtubeChannelId: channel.channelId },
    update: {
      handle: channel.handle,
      title: channel.title,
      url: `https://www.youtube.com/channel/${channel.channelId}`,
    },
    create: {
      youtubeChannelId: channel.channelId,
      handle: channel.handle,
      title: channel.title,
      url: `https://www.youtube.com/channel/${channel.channelId}`,
    },
  });

  const run = await prisma.scraperRun.create({
    data: {
      channelId: dbChannel.id,
      startTime: startedAt,
      status: ScraperRunStatus.running,
    },
  });

  try {
    const youtube = getYoutubeClient();
    const videoIds = await listUploadsVideoIds(channel.uploadsPlaylistId, input.maxVideos);
    videosFound = videoIds.length;

    const batches = chunkArray(videoIds, 50);
    for (const batchIds of batches) {
      const details = await youtube.videos.list({
        part: ["snippet", "contentDetails", "statistics"],
        id: batchIds,
        maxResults: 50,
      });

      for (const item of details.data.items ?? []) {
        const youtubeVideoId = item.id;
        const snippet = item.snippet;
        const contentDetails = item.contentDetails;
        const statistics = item.statistics;

        if (!youtubeVideoId || !snippet?.publishedAt || !snippet?.title) {
          continue;
        }

        const publishedAt = new Date(snippet.publishedAt);
        const existing = await prisma.video.findUnique({
          where: { youtubeVideoId },
          select: {
            id: true,
            transcript: { select: { id: true } },
          },
        });

        const dataForVideo = {
          channelId: dbChannel.id,
          title: snippet.title,
          description: snippet.description ?? "",
          publishedAt,
          url: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
          thumbnailUrl:
            snippet.thumbnails?.maxres?.url ??
            snippet.thumbnails?.high?.url ??
            snippet.thumbnails?.medium?.url ??
            snippet.thumbnails?.default?.url ??
            "",
          durationSec: parseIsoDurationToSeconds(contentDetails?.duration ?? ""),
          viewCount: toBigIntOrNull(statistics?.viewCount),
          likeCount: toBigIntOrNull(statistics?.likeCount),
          commentCount: toBigIntOrNull(statistics?.commentCount),
          tags: snippet.tags ?? [],
          rawMetadata: toInputJson(item),
          lastSeenAt: new Date(),
          lastMetricsAt: new Date(),
        };

        const video = existing
          ? await prisma.video.update({
              where: { youtubeVideoId },
              data: dataForVideo,
            })
          : await prisma.video.create({
              data: {
                ...dataForVideo,
                youtubeVideoId,
                firstSeenAt: new Date(),
              },
            });

        if (existing) {
          videosUpdated += 1;
        } else {
          videosCreated += 1;
        }

        await prisma.videoMetricSnapshot.create({
          data: {
            videoId: video.id,
            capturedAt: new Date(),
            viewCount: toBigIntOrNull(statistics?.viewCount),
            likeCount: toBigIntOrNull(statistics?.likeCount),
            commentCount: toBigIntOrNull(statistics?.commentCount),
            rawMetrics: toInputJson(statistics ?? {}),
          },
        });

        if (!existing?.transcript || input.forceTranscriptRefresh) {
          const transcript = await fetchTranscriptForVideo(youtubeVideoId);
          if (transcript) {
            await prisma.transcript.upsert({
              where: { videoId: video.id },
              update: {
                transcriptText: transcript.transcriptText,
                languageCode: transcript.languageCode,
                transcriptSource: transcript.source,
                fetchedAt: new Date(),
                rawTranscript: toInputJson(transcript.rawTranscript),
              },
              create: {
                videoId: video.id,
                transcriptText: transcript.transcriptText,
                languageCode: transcript.languageCode,
                transcriptSource: transcript.source,
                rawTranscript: toInputJson(transcript.rawTranscript),
              },
            });
          }
        }
      }
    }

    const endTime = new Date();
    const durationMs = endTime.getTime() - startedAt.getTime();

    await prisma.scraperRun.update({
      where: { id: run.id },
      data: {
        endTime,
        status: ScraperRunStatus.success,
        videosFound,
        videosCreated,
        videosUpdated,
        errorsCount: errors.length,
        errorsJson: errors,
        durationMs,
      },
    });

    return {
      runId: run.id,
      status: "success",
      startTime: startedAt.toISOString(),
      endTime: endTime.toISOString(),
      videosFound,
      videosCreated,
      videosUpdated,
      errors,
      durationMs,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    errors.push(message);

    const endTime = new Date();
    const durationMs = Date.now() - start;

    await prisma.scraperRun.update({
      where: { id: run.id },
      data: {
        endTime,
        status: ScraperRunStatus.failed,
        videosFound,
        videosCreated,
        videosUpdated,
        errorsCount: errors.length,
        errorsJson: errors,
        durationMs,
      },
    });

    return {
      runId: run.id,
      status: "failed",
      startTime: startedAt.toISOString(),
      endTime: endTime.toISOString(),
      videosFound,
      videosCreated,
      videosUpdated,
      errors,
      durationMs,
    };
  }
}
