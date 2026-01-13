import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { generateBlueGradient } from "@/lib/utils";
import { Mail, Clock, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const { data: teamMembers } = await sanityFetch({
    query: `*[_type == "account" && type in ["admin", "manager", "employee"] && status == "active"] | order(name asc){
      _id, name, email, type, avatar, timezone,
      "role": type
    }`,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Team Directory</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(teamMembers as any[]).map((member) => (
          <Card key={member._id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatar?.asset?.url} />
                <AvatarFallback 
                  style={{ background: generateBlueGradient(member.email) }}
                  className="text-white"
                >
                  {member.name?.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">{member.name}</CardTitle>
                <Badge variant="secondary" className="capitalize mt-1">{member.role}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>
              </div>
              {member.timezone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{member.timezone}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
