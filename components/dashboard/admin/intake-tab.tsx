"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IntakeTabProps {
  receivedSignups: any[];
  submittedSponsorships: any[];
  employees: any[];
  actions: {
    assignSignup: (formData: FormData) => Promise<void>;
    assignSponsorship: (formData: FormData) => Promise<void>;
  };
}
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function IntakeTab({ receivedSignups, submittedSponsorships, employees, actions }: IntakeTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Signups */}
        <Card>
          <CardHeader>
            <CardTitle>New Signups</CardTitle>
            <CardDescription>{receivedSignups.length} pending signups.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {receivedSignups.map((s) => (
              <div key={s._id} className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{s.name || s.email}</div>
                    <div className="text-sm text-muted-foreground">{s.event?.title || "Event"}</div>
                  </div>
                  <Badge variant="outline">{s.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">{s.email}</div>
                  <form action={actions.assignSignup} className="flex items-center gap-2">
                    <input type="hidden" name="signupId" value={s._id} />
                    <Select name="assigneeId" defaultValue={employees[0]?._id || ""}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e._id} value={e._id}>
                             <div className="flex items-center gap-2">
                               <Avatar className="h-4 w-4">
                                 <AvatarImage src={`https://avatar.vercel.sh/${e.email}`} />
                                 <AvatarFallback>{e.name?.[0] || e.email?.[0]}</AvatarFallback>
                               </Avatar>
                               <span>{e.name || e.email}</span>
                             </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" disabled={!employees.length}>
                      Assign
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {receivedSignups.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No new signups.</div>
            )}
          </CardContent>
        </Card>

        {/* Sponsorships */}
        <Card>
          <CardHeader>
            <CardTitle>New Sponsorships</CardTitle>
            <CardDescription>{submittedSponsorships.length} pending sponsorships.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {submittedSponsorships.map((sp) => (
              <div key={sp._id} className="flex flex-col gap-3 rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{sp.businessName || "Sponsorship"}</div>
                    <div className="text-sm text-muted-foreground">{sp.contactEmail}</div>
                  </div>
                  <Badge variant="outline">{sp.status}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    {sp.mealsCount ? `${sp.mealsCount} meals` : ""}
                    {sp.location ? ` • ${sp.location}` : ""}
                  </div>
                  <form action={actions.assignSponsorship} className="flex items-center gap-2">
                    <input type="hidden" name="sponsorshipId" value={sp._id} />
                    <Select name="assigneeId" defaultValue={employees[0]?._id || ""}>
                      <SelectTrigger className="h-8 w-[140px]">
                        <SelectValue placeholder="Assign to..." />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((e) => (
                          <SelectItem key={e._id} value={e._id}>
                             <div className="flex items-center gap-2">
                               <Avatar className="h-4 w-4">
                                 <AvatarImage src={`https://avatar.vercel.sh/${e.email}`} />
                                 <AvatarFallback>{e.name?.[0] || e.email?.[0]}</AvatarFallback>
                               </Avatar>
                               <span>{e.name || e.email}</span>
                             </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" disabled={!employees.length}>
                      Assign
                    </Button>
                  </form>
                </div>
              </div>
            ))}
            {submittedSponsorships.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No new sponsorships.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
