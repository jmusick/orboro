const INDEXNOW_KEY = "00b5d4eb80cc64a1451e6a4e5efa248e";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Notify IndexNow (Bing, Yandex, and other participating engines) that a URL
 * changed. Fire-and-forget from the caller's perspective: failures are
 * swallowed so a ping outage never blocks publishing content.
 */
export async function pingIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) return;

  try {
    await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "orboro.net",
        key: INDEXNOW_KEY,
        keyLocation: `https://orboro.net/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    // Non-fatal: search engines will still discover the URL via sitemap/crawl.
  }
}
