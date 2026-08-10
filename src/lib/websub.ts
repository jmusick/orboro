const WEBSUB_HUB = "https://pubsubhubbub.appspot.com/";

/**
 * Tell the WebSub hub the feed changed so subscribed readers (Feedly,
 * Superfeedr, etc.) get pushed the update instead of waiting on their next
 * poll. Fire-and-forget: failures are swallowed so a hub outage never blocks
 * publishing content.
 */
export async function pingWebSub(feedUrl: string): Promise<void> {
  try {
    await fetch(WEBSUB_HUB, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        "hub.mode": "publish",
        "hub.url": feedUrl,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal: the hub will eventually re-poll the feed on its own schedule.
  }
}
