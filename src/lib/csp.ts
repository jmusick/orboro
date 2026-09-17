// Shared by every shortcode that emits its own inline <style>/<script> tags,
// so they carry the per-request CSP nonce set in middleware.ts. `nonce` is
// omitted for callers outside the Astro render pipeline (e.g. rss.xml.ts),
// where there's no CSP header to match against anyway.
export function nonceAttr(nonce?: string): string {
  return nonce ? ` nonce="${nonce}"` : "";
}
