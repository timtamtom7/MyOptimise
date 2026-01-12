"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { createUpsellLead } from "@/app/actions/upsell";

export function UpsellCard({ account }: { account: any }) {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
      setLoading(true);
      try {
          await createUpsellLead();
          toast.success("Upgrade request sent!", {
              description: "Your account manager will contact you shortly."
          });
      } catch (error) {
          toast.error("Something went wrong. Please try again.");
      } finally {
          setLoading(false);
      }
  };

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-background border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Upgrade Your Growth
        </CardTitle>
        <CardDescription>
            Unlock more posts, AI analysis, and 24/7 support.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-sm space-y-2 mb-4">
            <li className="flex items-center gap-2">✓ Priority Scheduling</li>
            <li className="flex items-center gap-2">✓ Advanced Analytics</li>
            <li className="flex items-center gap-2">✓ 5 Video Edits / mo</li>
        </ul>
      </CardContent>
      <CardFooter>
          <Button className="w-full" onClick={handleUpgrade} disabled={loading}>
              {loading ? "Sending..." : "Request Upgrade"}
          </Button>
      </CardFooter>
    </Card>
  );
}
