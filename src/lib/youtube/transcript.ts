import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptResult {
  transcriptText: string;
  languageCode: string | null;
  source: string;
  rawTranscript: unknown;
}

export async function fetchTranscriptForVideo(
  videoId: string,
): Promise<TranscriptResult | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    if (!segments.length) {
      return null;
    }

    const transcriptText = segments.map((segment) => segment.text).join(" ").trim();
    if (!transcriptText) {
      return null;
    }

    return {
      transcriptText,
      languageCode: segments[0]?.lang ?? null,
      source: "youtube-transcript",
      rawTranscript: segments,
    };
  } catch {
    return null;
  }
}
