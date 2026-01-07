import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Users, Hash } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const { data: currentUser } = await sanityFetch({
    query: `*[_type == "account" && email == $email][0]{_id}`,
    params: { email },
  });

  if (!currentUser) redirect("/login");

  // Fetch threads where user is participant
  const { data: threads } = await sanityFetch({
    query: `*[_type == "messageThread" && $userId in participants[]._ref] | order(updatedAt desc) {
      _id, title, type, updatedAt,
      "lastMessage": messages[-1],
      "participants": participants[]->{_id, name, avatar},
      relatedClient->{businessName}
    }`,
    params: { userId: currentUser._id },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
      </div>

      <div className="grid gap-4">
        {(threads as any[]).length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mb-2" />
              <p>No messages yet.</p>
            </CardContent>
          </Card>
        )}

        {(threads as any[]).map((thread) => (
          <Link key={thread._id} href={`/dashboard/employee/messages/${thread._id}`}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {thread.type === "dm" ? (
                    <Avatar>
                      <AvatarImage src={thread.participants?.find((p: any) => p._id !== currentUser._id)?.avatar?.asset?.url} />
                      <AvatarFallback>
                        {thread.participants?.find((p: any) => p._id !== currentUser._id)?.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold truncate flex items-center gap-2">
                      {thread.title || "Untitled Thread"}
                      {thread.relatedClient && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {thread.relatedClient.businessName}
                        </Badge>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {thread.updatedAt ? formatDistanceToNow(new Date(thread.updatedAt), { addSuffix: true }) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {thread.lastMessage?.text || "No messages yet"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
