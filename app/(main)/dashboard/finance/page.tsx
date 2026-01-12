import { safeGetServerSession } from "@/lib/auth";
import { hasAccountCapability } from "@/lib/capabilities";
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
import { CreateInvoiceDialog } from "@/components/dashboard/finance/create-invoice-dialog";
import { InvoiceActions } from "@/components/dashboard/finance/invoice-actions";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) redirect("/login");

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct) redirect("/login");
  if (acct.status === "disabled") redirect("/login");

  // Only those with finance.view.all capability can access this page (Admins usually)
  if (!hasAccountCapability(acct, "finance.view.all")) {
    redirect("/dashboard");
  }

  // Fetch Invoices
  const query = defineQuery(`
    *[_type == "invoice"] | order(issuedDate desc) {
      _id,
      invoiceNumber,
      status,
      amount,
      currency,
      issuedDate,
      dueDate,
      "clientName": client->name
    }
  `);

  // Fetch Clients
  const clientsQuery = defineQuery(`
    *[_type == "account" && type == "client"] | order(name asc) {
      _id,
      name
    }
  `);

  const [{ data: invoices }, { data: clients }] = await Promise.all([
    sanityFetch({ query }),
    sanityFetch({ query: clientsQuery }),
  ]);

  const safeInvoices = invoices || [];
  const safeClients = clients || [];

  // Calculate Metrics
  const totalRevenue = safeInvoices
    .filter((i: any) => i.status === "paid")
    .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
  
  const outstandingAmount = safeInvoices
    .filter((i: any) => i.status === "sent")
    .reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

  const canCreate = hasAccountCapability(acct, "finance.create");
  const canUpdate = hasAccountCapability(acct, "finance.update");

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Finance</h1>
          <p className="text-muted-foreground">
            Financial overview, revenue, and invoices.
          </p>
        </div>
        {canCreate && <CreateInvoiceDialog clients={safeClients} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue (Paid)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${outstandingAmount.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            All system invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {canUpdate && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canUpdate ? 7 : 6} className="text-center h-24 text-muted-foreground">
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                safeInvoices.map((invoice: any) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName || "-"}</TableCell>
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
                    {canUpdate && (
                      <TableCell>
                        <InvoiceActions 
                          invoiceId={invoice._id} 
                          currentStatus={invoice.status} 
                        />
                      </TableCell>
                    )}
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
