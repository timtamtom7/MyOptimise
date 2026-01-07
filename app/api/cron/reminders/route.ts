import { client } from "@/sanity/lib/client";
import { sendEmail } from "@/lib/email";
import { deliverableStalledEmail, taskOverdueEmail } from "@/lib/email-templates";
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
    // 1. Stalled Approvals (> 48h)
    // _updatedAt is when it last changed status (if status change updates the doc, which it does)
    const stalledDeliverables = await writeClient.fetch<any[]>(
      `*[_type == "deliverable" && status == "client_review" && dateTime(_updatedAt) < dateTime(now()) - 60*60*48]{
        _id,
        title,
        "campaignTitle": campaign->title,
        "clientEmail": campaign->client->email
      }`
    );

    const stalledResults = await Promise.all(
      stalledDeliverables.map(async (item) => {
        if (!item.clientEmail) return { id: item._id, status: "skipped_no_email" };
        
        const link = `${process.env.NEXT_PUBLIC_SITE_URL || "https://myoptimise.org"}/dashboard/client/approvals`;
        
        await sendEmail({
          to: item.clientEmail,
          subject: `Action Required: ${item.title} Pending Approval`,
          html: deliverableStalledEmail({
            deliverableTitle: item.title,
            campaignTitle: item.campaignTitle || "Campaign",
            link,
          }),
        });
        
        return { id: item._id, status: "sent" };
      })
    );

    // 2. Overdue Tasks
    const overdueTasks = await writeClient.fetch<any[]>(
      `*[_type == "workItem" && status != "completed" && status != "cancelled" && defined(dueDate) && dateTime(dueDate) < dateTime(now())]{
        _id,
        title,
        dueDate,
        "assigneeEmail": assignedTo->email
      }`
    );

    const overdueResults = await Promise.all(
      overdueTasks.map(async (item) => {
        if (!item.assigneeEmail) return { id: item._id, status: "skipped_no_email" };

        const link = `${process.env.NEXT_PUBLIC_SITE_URL || "https://myoptimise.org"}/dashboard/employee/tasks`;
        
        await sendEmail({
          to: item.assigneeEmail,
          subject: `Overdue: ${item.title}`,
          html: taskOverdueEmail({
            taskTitle: item.title,
            dueDate: new Date(item.dueDate).toLocaleDateString(),
            link,
          }),
        });

        return { id: item._id, status: "sent" };
      })
    );

    return NextResponse.json({
      success: true,
      stalled: stalledResults,
      overdue: overdueResults,
    });

  } catch (error) {
    console.error("Cron Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
