import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";
import { token } from "@/sanity/lib/token";

const enableDraftMode = token
  ? defineEnableDraftMode({
      client: client.withConfig({ token }),
    })
  : null;

export const GET = (request: Request) => {
  if (!enableDraftMode) {
    return new Response("Missing SANITY_API_READ_TOKEN", { status: 500 });
  }
  return enableDraftMode.GET(request);
};
