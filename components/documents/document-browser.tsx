"use client";

import { useState } from "react";
import { 
  FileText, 
  Folder, 
  MoreHorizontal, 
  Search, 
  Grid, 
  List as ListIcon, 
  Download, 
  Share2, 
  Trash2,
  File,
  FileImage,
  FileSpreadsheet,
  FileCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { UploadDocumentDialog } from "./upload-document-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentItem {
  _id: string;
  title: string;
  folder?: string;
  visibility: "internal" | "client";
  createdAt: string;
  updatedAt: string;
  fileUrl: string;
  fileName: string;
  sharedWith?: any[];
}

interface DocumentBrowserProps {
  documents: DocumentItem[];
  folders: string[];
  clients: any[];
  canUpload: boolean;
}

export function DocumentBrowser({ documents, folders, clients, canUpload }: DocumentBrowserProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDocs = documents.filter(doc => {
    const matchesFolder = selectedFolder ? doc.folder === selectedFolder : true;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'png', 'jpeg', 'gif', 'svg'].includes(ext || '')) return <FileImage className="h-8 w-8 text-purple-500" />;
    if (['pdf'].includes(ext || '')) return <FileText className="h-8 w-8 text-red-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="h-8 w-8 text-green-500" />;
    if (['js', 'ts', 'tsx', 'json'].includes(ext || '')) return <FileCode className="h-8 w-8 text-blue-500" />;
    return <File className="h-8 w-8 text-slate-400" />;
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-4 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
          <Button
            variant={selectedFolder === null ? "default" : "ghost"}
            onClick={() => setSelectedFolder(null)}
            className={cn(
              "rounded-[1.5rem] px-5 font-bold h-10 transition-all whitespace-nowrap",
              selectedFolder === null ? "shadow-md bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            )}
          >
            All Files
          </Button>
          {folders.map(folder => (
            <Button
              key={folder}
              variant={selectedFolder === folder ? "default" : "ghost"}
              onClick={() => setSelectedFolder(folder)}
              className={cn(
                "rounded-[1.5rem] px-5 font-bold h-10 transition-all whitespace-nowrap",
                selectedFolder === folder ? "shadow-md bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Folder className="mr-2 h-4 w-4" /> {folder}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 rounded-[1.5rem] bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
            />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-[1.5rem]">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewMode("grid")}
              className={cn("rounded-full h-10 w-10", viewMode === "grid" && "bg-white dark:bg-slate-700 shadow-sm")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setViewMode("list")}
              className={cn("rounded-full h-10 w-10", viewMode === "list" && "bg-white dark:bg-slate-700 shadow-sm")}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>

          {canUpload && <UploadDocumentDialog folders={folders} clients={clients} />}
        </div>
      </div>

      {/* Content */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-full mb-4">
                <Folder className="h-12 w-12 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-medium">No documents found</p>
        </div>
      ) : (
        <>
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredDocs.map(doc => (
                        <div key={doc._id} className="group relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                    {getFileIcon(doc.fileName)}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-slate-100 dark:hover:bg-slate-800">
                                            <MoreHorizontal className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="rounded-xl">
                                        <DropdownMenuItem onClick={() => window.open(doc.fileUrl, '_blank')}>
                                            <Download className="mr-2 h-4 w-4" /> Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Share2 className="mr-2 h-4 w-4" /> Share
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            
                            <h3 className="font-bold text-lg mb-1 truncate" title={doc.title}>{doc.title}</h3>
                            <p className="text-sm text-slate-400 truncate mb-4">{doc.fileName}</p>
                            
                            <div className="flex items-center justify-between mt-auto">
                                <Badge variant="secondary" className="rounded-lg font-medium">
                                    {doc.visibility === "client" ? "Shared" : "Internal"}
                                </Badge>
                                <span className="text-xs text-slate-400 font-medium">
                                    {format(new Date(doc.updatedAt || doc.createdAt), "MMM d, yyyy")}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Folder</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Visibility</th>
                                <th className="w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredDocs.map(doc => (
                                <tr key={doc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                                {getFileIcon(doc.fileName)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-slate-100">{doc.title}</div>
                                                <div className="text-xs text-slate-500">{doc.fileName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {doc.folder || "—"}
                                    </td>
                                    <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                                        {format(new Date(doc.updatedAt || doc.createdAt), "MMM d, yyyy")}
                                    </td>
                                    <td className="py-4 px-6">
                                        <Badge variant={doc.visibility === "client" ? "default" : "secondary"} className="rounded-lg">
                                            {doc.visibility === "client" ? "Shared" : "Internal"}
                                        </Badge>
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.open(doc.fileUrl, '_blank')}>
                                            <Download className="h-4 w-4 text-slate-400" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
      )}
    </div>
  );
}
