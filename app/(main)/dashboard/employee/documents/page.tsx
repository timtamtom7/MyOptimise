import { sanityFetch } from "@/sanity/lib/live";
import { safeGetServerSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Download, User } from "lucide-react";
import { formatDate } from "@/lib/date-formatting";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const session = await safeGetServerSession();
  if (!session) redirect("/login");

  const email = String((session as any)?.user?.email || "");
  const { data: currentUser } = await sanityFetch({
    query: `*[_type == "account" && email == $email][0]{_id}`,
    params: { email },
  });

  if (!currentUser) redirect("/login");

  // Fetch documents that are either internal, shared with user, or created by user
  const { data: documents } = await sanityFetch({
    query: `*[_type == "documentItem" && (
      visibility == "internal" || 
      $userId in sharedWith[]._ref || 
      createdBy._ref == $userId
    )] | order(createdAt desc){
      _id, title, folder, 
      "fileUrl": file.asset->url,
      "fileSize": file.asset->size,
      "fileType": file.asset->mimeType,
      visibility,
      createdAt,
      "createdBy": createdBy->name
    }`,
    params: { userId: currentUser._id },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button>Upload Document</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Folder</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(documents as any[]).map((doc) => (
                <TableRow key={doc._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {doc.title}
                    </div>
                  </TableCell>
                  <TableCell>{doc.folder || "Root"}</TableCell>
                  <TableCell>
                    <Badge variant={doc.visibility === "internal" ? "secondary" : "outline"}>
                      {doc.visibility}
                    </Badge>
                  </TableCell>
                  <TableCell>{doc.createdBy || "Unknown"}</TableCell>
                  <TableCell>{doc.createdAt ? formatDate(doc.createdAt, "MMM d, yyyy") : "-"}</TableCell>
                  <TableCell className="text-right">
                    {doc.fileUrl && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(documents as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No documents found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
