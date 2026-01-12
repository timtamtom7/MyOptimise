"use server";

import { client } from "@/sanity/lib/client";
import { revalidateTag } from "next/cache";

export async function seedAnalyticsData() {
  const writeToken = process.env.SANITY_API_WRITE_TOKEN;
  if (!writeToken) throw new Error("Missing write token");
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // Fetch a client to link to
  const clients = await client.fetch(`*[_type == "account" && type == "client"][0]`);
  if (!clients) return;

  const today = new Date();
  const metrics = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    metrics.push({
      metric: "Impressions",
      value: Math.floor(Math.random() * 1000) + 1000 + (i * 10), // Random trend
      metricDate: date.toISOString().split('T')[0]
    });
  }

  const tx = writeClient.transaction();
  
  metrics.forEach(m => {
    tx.create({
      _type: "analyticsRecord",
      client: { _type: "reference", _ref: clients._id },
      metric: m.metric,
      value: m.value,
      metricDate: m.metricDate,
      period: "daily",
      visibility: "client"
    });
  });

  await tx.commit();
  revalidateTag("analyticsRecord", "");
}
