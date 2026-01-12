import { defineLive } from "next-sanity/live";
import { client } from "./client";
import { token } from "./token";
import { sanityConfigured } from "../env";

const live = defineLive({
  client,
  // Required for showing draft content when the Sanity Presentation Tool is used, or to enable the Vercel Toolbar Edit Mode
  serverToken: token,
  // Required for stand-alone live previews, the token is only shared to the brwoser if it's a valid Next.js Draft Mode session
  browserToken: token,
});

export const SanityLive = sanityConfigured ? live.SanityLive : (() => null);

export async function sanityFetch(...args: Parameters<typeof live.sanityFetch>) {
  console.log("sanityFetch called", args[0]?.query);
  const empty = { data: null, sourceMap: null, tags: [] } as Awaited<ReturnType<typeof live.sanityFetch>>;
  if (!sanityConfigured) {
    console.log("sanityFetch: not configured");
    return empty;
  }
  try {
    const result = await live.sanityFetch(...args);
    console.log("sanityFetch success");
    return result;
  } catch (e) {
    console.error("sanityFetch error", e);
    return empty;
  }
}
