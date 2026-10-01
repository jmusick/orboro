// Content timestamps are milliseconds. Reject bad units and implausible values
// rather than inventing an edit date for the public page.
export function formatPageUpdatedAt(timestamp: number, now = Date.now()): string | null {
  if (!Number.isSafeInteger(timestamp) || timestamp < Date.UTC(2000, 0, 1) || timestamp > now + 86_400_000) {
    return null;
  }
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });
}
