import { client } from "./client";
import { sanityConfigured } from "../env";

export const SanityLive = () => null;

type SanityFetchOptions = {
  query: string;
  params?: Record<string, unknown>;
  perspective?: "published" | "previewDrafts" | "raw";
  tags?: string[];
  stega?: boolean;
};

export async function sanityFetch(options: SanityFetchOptions) {
  console.log("sanityFetch called", options?.query);
  const empty = { data: null, sourceMap: null, tags: [] as string[] };
  if (!sanityConfigured) {
    console.log("sanityFetch: not configured");
    return empty;
  }
  try {
    const fetchOptions: any = {};
    if (options.perspective) fetchOptions.perspective = options.perspective;
    if (options.tags) fetchOptions.tag = options.tags[0]; // Sanity client uses 'tag' (singular) usually for single tag or we might need to check client capability
    // Actually, client.fetch(query, params, options)
    // options can have { perspective, tag, ... }
    
    // Adjusting based on standard Sanity client usage
    const queryOptions: any = {
       perspective: options.perspective,
    };
    
    // Support Next.js cache tags if provided
    if (options.tags && options.tags.length > 0) {
      queryOptions.next = { tags: options.tags };
    }

    // The client.fetch(query, params, options) signature support
    if (options.stega !== undefined) queryOptions.stega = options.stega;
    
    const data = await client.fetch(options.query, options.params || {}, queryOptions);
    console.log("sanityFetch success");
    return { data, sourceMap: null, tags: [] as string[] };
  } catch (e) {
    console.error("sanityFetch error", e);
    return empty;
  }
}
