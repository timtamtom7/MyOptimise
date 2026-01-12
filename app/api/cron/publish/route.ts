import { client } from "@/sanity/lib/client";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) {
    return new Response("Missing Write Token", { status: 500 });
  }
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  try {
    // 1. Find scheduled posts that are due
    // status == "scheduled" AND scheduledAt <= now
    const postsToPublish = await writeClient.fetch<any[]>(
      `*[_type == "contentItem" && status == "scheduled" && defined(scheduledAt) && dateTime(scheduledAt) <= dateTime(now())]{
        _id,
        title,
        platform,
        postType,
        caption,
        "media": media[].asset->url,
        "client": client->{
          _id,
          name
        },
        scheduledAt
      }`
    );

    if (postsToPublish.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "No posts to publish" });
    }

    const results = await Promise.all(
      postsToPublish.map(async (post) => {
        try {
          // 2. Find Social Connection
          const connection = await writeClient.fetch(
            `*[_type == "socialConnection" && client._ref == $clientId && platform == $platform && status == "active"][0]`,
            { clientId: post.client._id, platform: post.platform }
          );

          if (!connection) {
            console.error(`No active connection for ${post.client.name} on ${post.platform}`);
            // Optionally update status to 'failed' or notify admin
            return { id: post._id, status: "failed", reason: "no_connection" };
          }

          // 3. Publish (Simulated)
          console.log(`[PUBLISH] Publishing "${post.title}" to ${post.platform} for ${post.client.name}`);
          // In real implementation:
          // if (post.platform === 'instagram') await publishToInstagram(connection.accessToken, post);
          
          // 4. Update Status
          await writeClient
            .patch(post._id)
            .set({ 
              status: "published",
              publishedAt: new Date().toISOString()
            })
            .commit();

          return { id: post._id, status: "published" };

        } catch (err) {
          console.error(`Failed to publish ${post._id}:`, err);
          return { id: post._id, status: "error", error: String(err) };
        }
      })
    );

    return NextResponse.json({
      success: true,
      count: results.length,
      results,
    });

  } catch (error) {
    console.error("Cron Publish Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
