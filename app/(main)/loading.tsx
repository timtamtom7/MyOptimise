import { Skeleton } from "@/components/ui/skeleton";

export default function MainLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Skeleton */}
      <div className="border-b h-16 flex items-center px-4 md:px-6">
         <Skeleton className="h-6 w-32" />
         <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
         </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="flex-1 p-6 space-y-6 container max-w-7xl mx-auto">
         <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-lg" />
         </div>
         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[200px] rounded-xl" />
         </div>
      </div>
    </div>
  );
}
