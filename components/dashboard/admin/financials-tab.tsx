"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-formatting";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/dashboard/finance/create-invoice-dialog";

interface FinancialsTabProps {
  invoices: any[];
  clients: any[];
  editorPayouts: {
    editorId: string;
    editorName: string;
    editorEmail: string;
    totalEarned: number;
    jobsCompleted: number;
    activeJobs: number;
  }[];
}

export function FinancialsTab({ invoices, clients, editorPayouts }: FinancialsTabProps) {
  // Calculate metrics
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);

  const totalPayouts = editorPayouts.reduce((acc, row) => acc + row.totalEarned, 0);
  const grossProfit = totalRevenue - totalPayouts;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const outstandingAmount = invoices
    .filter((inv) => inv.status === "sent" || inv.status === "overdue")
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);

  const overdueAmount = invoices
    .filter((inv) => {
        if (inv.status !== "sent") return false;
        const due = new Date(inv.dueDate);
        return due < new Date();
    })
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);

  const recentInvoices = invoices.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Collected from {invoices.filter(i => i.status === "paid").length} invoices
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${grossProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {profitMargin.toFixed(1)}% margin (Rev - Payouts)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${outstandingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Pending payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editor Performance & Workload</CardTitle>
          <CardDescription>
            Approved payouts and current active workload.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {editorPayouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No data found.
            </div>
          ) : (
            <div className="space-y-4">
              {editorPayouts.map((row) => (
                <div
                  key={row.editorId}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="text-sm font-medium leading-none">
                      {row.editorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.editorEmail}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm font-medium">
                        ${row.totalEarned.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        {row.jobsCompleted} completed
                        </p>
                    </div>
                    <div className="text-right min-w-[80px]">
                        <Badge variant={row.activeJobs > 5 ? "destructive" : row.activeJobs > 2 ? "secondary" : "outline"}>
                            {row.activeJobs} Active
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                            Current Load
                        </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Latest invoices generated across all clients.
            </CardDescription>
          </div>
          <CreateInvoiceDialog clients={clients} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentInvoices.map((inv) => (
              <div
                key={inv._id}
                className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {inv.invoiceNumber || inv.number || "INV-???"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {inv.client?.name || "Unknown Client"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium">
                            ${(inv.amount || inv.totalAmount || 0).toLocaleString()} {inv.currency || "USD"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDate(inv.issuedDate || inv.issueDate, { timeZone: "UTC" }) || "No date"}
                        </p>
                    </div>
                    <Badge
                        variant={
                        inv.status === "paid"
                            ? "default" // "success" if available, but default is usually dark
                            : inv.status === "sent"
                            ? "secondary"
                            : "outline"
                        }
                        className={inv.status === "paid" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                        {inv.status}
                    </Badge>
                </div>
              </div>
            ))}
            {recentInvoices.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    No invoices found.
                </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
