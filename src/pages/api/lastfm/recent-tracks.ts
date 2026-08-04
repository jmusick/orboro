import type { APIRoute } from "astro";
import { fetchRecentTracks } from "../../../lib/lastfm";

export const GET: APIRoute = async () => {
  const tracks = await fetchRecentTracks(7);
  return new Response(JSON.stringify(tracks), {
    headers: { "Content-Type": "application/json" },
  });
};
