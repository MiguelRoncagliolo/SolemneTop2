import { google } from "googleapis";

import { getEnv } from "@/lib/env";

export function getYoutubeClient() {
  const env = getEnv();
  return google.youtube({
    version: "v3",
    auth: env.YOUTUBE_API_KEY,
  });
}

export interface ResolvedChannel {
  channelId: string;
  title: string;
  handle: string | null;
  uploadsPlaylistId: string;
}

export async function resolveChannelByHandle(
  handleInput: string,
): Promise<ResolvedChannel> {
  const youtube = getYoutubeClient();
  const normalizedHandle = handleInput.startsWith("@")
    ? handleInput.slice(1)
    : handleInput;

  const byHandle = await youtube.channels.list({
    part: ["id", "snippet", "contentDetails"],
    forHandle: normalizedHandle,
    maxResults: 1,
  });

  const handleChannel = byHandle.data.items?.[0];
  if (handleChannel?.id && handleChannel.contentDetails?.relatedPlaylists?.uploads) {
    return {
      channelId: handleChannel.id,
      title: handleChannel.snippet?.title ?? normalizedHandle,
      handle: handleChannel.snippet?.customUrl ?? `@${normalizedHandle}`,
      uploadsPlaylistId: handleChannel.contentDetails.relatedPlaylists.uploads,
    };
  }

  const bySearch = await youtube.search.list({
    part: ["snippet"],
    q: handleInput,
    type: ["channel"],
    maxResults: 1,
  });

  const searchChannelId = bySearch.data.items?.[0]?.snippet?.channelId;
  if (!searchChannelId) {
    throw new Error(`Channel not found for handle ${handleInput}`);
  }

  const channelDetails = await youtube.channels.list({
    part: ["id", "snippet", "contentDetails"],
    id: [searchChannelId],
    maxResults: 1,
  });

  const resolved = channelDetails.data.items?.[0];
  if (!resolved?.id || !resolved.contentDetails?.relatedPlaylists?.uploads) {
    throw new Error(`Unable to resolve uploads playlist for ${handleInput}`);
  }

  return {
    channelId: resolved.id,
    title: resolved.snippet?.title ?? normalizedHandle,
    handle: resolved.snippet?.customUrl ?? `@${normalizedHandle}`,
    uploadsPlaylistId: resolved.contentDetails.relatedPlaylists.uploads,
  };
}

export async function listUploadsVideoIds(
  uploadsPlaylistId: string,
  limit: number,
): Promise<string[]> {
  const youtube = getYoutubeClient();
  const ids: string[] = [];
  let nextPageToken: string | undefined;

  while (ids.length < limit) {
    const response = await youtube.playlistItems.list({
      part: ["contentDetails"],
      playlistId: uploadsPlaylistId,
      maxResults: Math.min(50, limit - ids.length),
      pageToken: nextPageToken,
    });

    const pageIds =
      response.data.items
        ?.map((item) => item.contentDetails?.videoId)
        .filter((id): id is string => Boolean(id)) ?? [];

    ids.push(...pageIds);
    nextPageToken = response.data.nextPageToken ?? undefined;

    if (!nextPageToken || pageIds.length === 0) {
      break;
    }
  }

  return ids;
}
