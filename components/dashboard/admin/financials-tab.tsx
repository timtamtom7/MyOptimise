"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-formatting";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

interface FinancialsTabProps {
  invoices: any[];
}

export function FinancialsTab({ invoices }: FinancialsTabProps) {
  // Calculate metrics
  const totalRevenue = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((acc, inv) => acc + (inv.amount || inv.totalAmount || 0), 0);

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
      <div className="grid gap-4 md:grid-cols-3">
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
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>
            Latest invoices generated across all clients.
          </CardDescription>
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
