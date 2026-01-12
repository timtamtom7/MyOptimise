"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Receipt } from "lucide-react";

export function BillingTab() {
  return (
    <div className="space-y-6">
      <Card>
          <CardHeader>
              <CardTitle>Billing & Invoices</CardTitle>
              <CardDescription>Manage your subscription and payment methods.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                          <p className="font-medium">Payment Method</p>
                          <p className="text-sm text-muted-foreground">•••• 4242</p>
                      </div>
                  </div>
                  <Button variant="outline">Update</Button>
              </div>
              
              <div className="space-y-2">
                  <h3 className="text-sm font-medium">Invoice History</h3>
                  <div className="border rounded-lg divide-y">
                      {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between p-4">
                              <div className="flex items-center gap-3">
                                  <Receipt className="h-4 w-4 text-muted-foreground" />
                                  <div className="text-sm">
                                      <p className="font-medium">Invoice #{2024000 + i}</p>
                                      <p className="text-muted-foreground">Oct {i}, 2024</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <span className="text-sm font-medium">$2,000.00</span>
                                  <Button variant="ghost" size="sm">Download</Button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </CardContent>
      </Card>
    </div>
  );
}
