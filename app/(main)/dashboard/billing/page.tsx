import { hasAccountCapability, safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { sanityFetch } from "@/sanity/lib/live";
import { redirect } from "next/navigation";
import { defineQuery } from "next-sanity";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) redirect("/login");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login");
  if (acct.status === "disabled") redirect("/login");

  // Check capability
  if (!hasAccountCapability(acct, "billing.manage_own")) {
    redirect("/dashboard");
  }

  // Fetch Invoices for this client
  const query = defineQuery(`
    *[_type == "invoice" && client._ref == $clientId] | order(issuedDate desc) {
      _id,
      invoiceNumber,
      status,
      amount,
      currency,
      issuedDate,
      dueDate
    }
  `);
  const { data: invoices } = await sanityFetch({ query, params: { clientId: acct._id } });
  const safeInvoices = invoices || [];

  const unpaidAmount = safeInvoices
    .filter((i: any) => i.status === "sent")
    .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
        <p className="text-muted-foreground">
          Manage your invoices and billing details.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${unpaidAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            History of invoices sent to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                safeInvoices.map((invoice: any) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      <Badge variant={
                        invoice.status === "paid" ? "default" :
                        invoice.status === "sent" ? "secondary" :
                        invoice.status === "draft" ? "outline" : "destructive"
                      }>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell className="text-right">
                      {invoice.amount?.toLocaleString()} {invoice.currency}
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.status === "sent" && (
                         <Button size="sm" variant="outline">Pay Now</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
