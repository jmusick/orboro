// Do not publish epoch-era, invalid, or implausibly future modification dates.
export function sitemapDate(timestamp: number | null, now = Date.now()): string | undefined {
  if (timestamp === null || !Number.isSafeInteger(timestamp) || timestamp < Date.UTC(2000, 0, 1) || timestamp > now + 86_400_000) return undefined;
  return new Date(timestamp).toISOString().slice(0, 10);
}
