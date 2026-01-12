"use server";

import { getServerSession } from "next-auth";
import { getAuthOptions } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { invoiceSentEmail } from "@/lib/email-templates";
import { formatDate } from "@/lib/date-formatting";

const writeClient = client.withConfig({
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

export async function createInvoice(formData: FormData) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || !hasAccountCapability(acct, "finance.create")) {
    throw new Error("Unauthorized");
  }

  const clientId = String(formData.get("clientId"));
  const amount = Number(formData.get("amount"));
  const dueDate = String(formData.get("dueDate"));
  const note = String(formData.get("note"));
  
  if (!clientId || !amount) {
    throw new Error("Missing required fields");
  }

  const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

  await writeClient.create({
    _type: "invoice",
    client: { _type: "reference", _ref: clientId },
    invoiceNumber,
    status: "draft",
    amount,
    currency: "USD",
    issuedDate: new Date().toISOString().split("T")[0],
    dueDate: dueDate || undefined,
    note: note || undefined,
    createdBy: { _type: "reference", _ref: acct._id },
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/dashboard/finance");
}

export async function updateInvoiceStatus(formData: FormData) {
  const session = await getServerSession(getAuthOptions());
  const email = session?.user?.email;
  if (!email) throw new Error("Unauthorized");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || !hasAccountCapability(acct, "finance.update")) {
    throw new Error("Unauthorized");
  }

  const invoiceId = String(formData.get("invoiceId"));
  const status = String(formData.get("status"));

  if (!invoiceId || !status) return;

  const updated = await writeClient
    .patch(invoiceId)
    .set({ status })
    .commit();

  // If status changed to 'sent', send email
  if (status === "sent") {
    // Fetch invoice details with client email
    const invoice = await writeClient.fetch(
      `*[_type == "invoice" && _id == $id][0]{
        invoiceNumber,
        amount,
        currency,
        dueDate,
        client->{
          email,
          name
        }
      }`,
      { id: invoiceId }
    );

    if (invoice?.client?.email) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard/billing`; // Client sees it in billing
      await sendEmail({
        to: invoice.client.email,
        subject: `New Invoice: ${invoice.invoiceNumber}`,
        html: invoiceSentEmail({
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          dueDate: invoice.dueDate ? formatDate(invoice.dueDate, "MMM d, yyyy") : undefined,
          link,
        }),
      });
    }
  }

  revalidatePath("/dashboard/finance");
}
