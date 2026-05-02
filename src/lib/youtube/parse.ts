const ISO_8601_DURATION_REGEX =
  /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

export function parseIsoDurationToSeconds(duration: string): number | null {
  const match = duration.match(ISO_8601_DURATION_REGEX);
  if (!match) {
    return null;
  }

  const days = Number(match[1] ?? 0);
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}
