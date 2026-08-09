import { env as workerEnv } from "cloudflare:workers";

const LASTFM_USER = "XingYuen";
const CACHE_TTL_SECONDS = 60;

export const LASTFM_PROFILE_URL = `https://www.last.fm/user/${LASTFM_USER}`;

export interface LastfmTrack {
  artist: string;
  name: string;
  album: string;
  image: string | null;
  url: string;
  nowPlaying: boolean;
  date: string | null;
}

interface LastfmImage {
  "#text": string;
  size: string;
}

interface LastfmApiTrack {
  artist: { "#text": string };
  name: string;
  album: { "#text": string };
  image?: LastfmImage[];
  url: string;
  date?: { uts: string };
  "@attr"?: { nowplaying?: string };
}

interface LastfmRecentTracksResponse {
  recenttracks?: {
    track?: LastfmApiTrack[];
  };
}

export async function fetchRecentTracks(limit = 5): Promise<LastfmTrack[]> {
  const apiKey = ((workerEnv as unknown) as { LASTFM_API_KEY?: string }).LASTFM_API_KEY;
  if (!apiKey) return [];

  const url = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${encodeURIComponent(LASTFM_USER)}&api_key=${encodeURIComponent(apiKey)}&format=json&limit=${limit}`;
  const cache = (caches as CacheStorage & { readonly default: Cache }).default;
  const cacheKey = new Request(url);

  let res = await cache.match(cacheKey);
  if (!res) {
    res = await fetch(url);
    if (res.ok) {
      const cacheable = new Response(res.body, res);
      cacheable.headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
      await cache.put(cacheKey, cacheable.clone());
      res = cacheable;
    }
  }

  if (!res.ok) return [];

  try {
    const data = (await res.json()) as LastfmRecentTracksResponse;
    // Last.fm's "limit" excludes an in-progress now-playing track, so a request
    // for N can come back with N+1 entries while something's live. Slice back
    // down so callers always get a stable count to lay out against.
    const rawTracks = data.recenttracks?.track ?? [];
    // When a track is playing, Last.fm returns it as a dateless "now playing"
    // entry, but once it's also been scrobbled the same track shows again as
    // the first history entry — producing a visible duplicate. Drop that
    // trailing repeat.
    const nowPlaying = rawTracks[0]?.["@attr"]?.nowplaying === "true";
    const isSameTrack = (a: LastfmApiTrack, b: LastfmApiTrack) =>
      a.name === b.name && a.artist["#text"] === b.artist["#text"];
    const deduped =
      nowPlaying && rawTracks.length > 1 && isSameTrack(rawTracks[0], rawTracks[1])
        ? [rawTracks[0], ...rawTracks.slice(2)]
        : rawTracks;
    const tracks = deduped.slice(0, limit);
    return tracks.map((t) => {
      const image =
        t.image?.find((i) => i.size === "large")?.["#text"] ||
        t.image?.[t.image.length - 1]?.["#text"] ||
        "";
      return {
        artist: t.artist["#text"],
        name: t.name,
        album: t.album["#text"],
        image: image || null,
        url: t.url,
        nowPlaying: t["@attr"]?.nowplaying === "true",
        date: t.date ? new Date(Number(t.date.uts) * 1000).toISOString() : null,
      };
    });
  } catch {
    return [];
  }
}
