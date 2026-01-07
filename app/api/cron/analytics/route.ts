import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Helper to generate random metrics
function generateMetric(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response("Missing Supabase Config", { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch active services
    const { data: services, error: fetchError } = await supabase
      .from("client_services")
      .select("id, service_type, organization_id")
      .eq("status", "active")
      .eq("is_active", true);

    if (fetchError) throw fetchError;
    if (!services || services.length === 0) {
      return NextResponse.json({ success: true, message: "No active services found" });
    }

    const metricsToInsert: any[] = [];
    const now = new Date().toISOString();

    // 2. Generate mock metrics for each service
    for (const service of services) {
      // Common metrics
      if (["instagram", "facebook", "linkedin", "twitter", "pinterest", "youtube"].includes(service.service_type)) {
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "impressions",
          metric_value: generateMetric(1000, 50000),
          recorded_at: now,
        });
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "engagement",
          metric_value: generateMetric(50, 2000),
          recorded_at: now,
        });
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "followers",
          metric_value: generateMetric(100, 10000), // In reality, this would be total, but here treating as 'new' or just snapshot
          recorded_at: now,
        });
      }

      if (service.service_type === "email") {
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "opens",
          metric_value: generateMetric(200, 5000),
          recorded_at: now,
        });
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "clicks",
          metric_value: generateMetric(20, 500),
          recorded_at: now,
        });
      }

      if (["website", "seo", "ads"].includes(service.service_type)) {
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "visitors",
          metric_value: generateMetric(500, 20000),
          recorded_at: now,
        });
        metricsToInsert.push({
          service_id: service.id,
          metric_name: "conversions",
          metric_value: generateMetric(5, 100),
          recorded_at: now,
        });
      }
    }

    // 3. Bulk Insert
    if (metricsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("service_metrics")
        .insert(metricsToInsert);
      
      if (insertError) throw insertError;
    }

    // 4. Update last_sync_at
    const serviceIds = services.map(s => s.id);
    await supabase
      .from("client_services")
      .update({ last_sync_at: now })
      .in("id", serviceIds);

    return NextResponse.json({
      success: true,
      services_processed: services.length,
      metrics_generated: metricsToInsert.length,
    });

  } catch (error) {
    console.error("Analytics Cron Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
