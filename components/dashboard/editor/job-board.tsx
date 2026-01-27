import { Brief } from "@/types/briefs";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

interface JobBoardProps {
  briefs: Brief[];
  type: "open" | "completed";
  onOpenBrief: (brief: Brief) => void;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isBriefUnclear(brief: Brief): boolean {
  const type = brief.format || "";

  const missingHook = !hasText(brief.hook || null);
  const missingScript = !hasText(brief.script || null);
  const missingVisual = !hasText(brief.visual_direction || null);
  const missingCreativeGoal = !hasText(brief.creative_goal || null);
  const missingContentConcept = !hasText(brief.content_concept || null);
  const missingAssets =
    !Array.isArray(brief.required_assets) || brief.required_assets.length === 0;

  const isVideo =
    typeof type === "string" &&
    (type.toLowerCase().includes("video") || type.toLowerCase().includes("reel"));

  if (isVideo) {
    return missingHook || missingScript || missingVisual || missingAssets;
  }

  return missingHook || missingCreativeGoal || missingContentConcept || missingAssets;
}

function getTimeRemaining(brief: Brief): string | null {
  if (!brief.claimed_at || !brief.deadline) return null;
  const now = new Date().getTime();
  const deadline = new Date(brief.deadline).getTime();
  const diff = deadline - now;
  if (Number.isNaN(deadline) || diff <= 0) return "Overdue";
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h left`;
  return `${remainingHours}h left`;
}

export function JobBoard({ briefs, type, onOpenBrief }: JobBoardProps) {
  if (briefs.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">No {type} jobs found.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {briefs.map((brief) => {
        const isOverdue = brief.deadline && new Date(brief.deadline) < new Date();
        const timeRemaining = getTimeRemaining(brief);
        
        return (
        <Card key={brief.id} className={`flex flex-col ${isOverdue ? "border-red-200 ring-1 ring-red-50" : ""}`}>
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div className="space-y-1">
                <CardTitle className="text-lg line-clamp-2">{brief.title}</CardTitle>
                <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                  {brief.metadata?.client && <span>{brief.metadata.client}</span>}
                  {brief.platform && <span>• {brief.platform}</span>}
                  {brief.format && <span>• {brief.format}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {brief.assignee_id ? (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    In Progress
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    Available
                  </Badge>
                )}
                {brief.difficulty && (
                  <Badge variant="outline" className="text-[10px] px-1">
                    {brief.difficulty} difficulty
                  </Badge>
                )}
                {isBriefUnclear(brief) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 text-[10px] mt-1">
                    <AlertTriangle className="h-3 w-3" />
                    Brief incomplete
                  </span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-2">
            <p className="text-sm text-muted-foreground line-clamp-2">
              {brief.hook || brief.creative_goal || "No hook provided"}
            </p>
            <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
              <div className="flex items-center gap-1">
                <Calendar className={`h-3 w-3 ${isOverdue ? "text-red-600" : ""}`} />
                <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                  {brief.deadline
                    ? `Due ${format(new Date(brief.deadline), "MMM d, yyyy")}`
                    : brief.created_at
                      ? format(new Date(brief.created_at), "MMM d, yyyy")
                      : "No deadline"}
                </span>
              </div>
              {type === "open" && (
                <div className={`flex items-center gap-1 ${timeRemaining === "Overdue" ? "text-red-600 font-bold" : ""}`}>
                  <Clock className="h-3 w-3" />
                  <span>
                    {timeRemaining || (brief.claimed_at ? "No deadline" : "Available")}
                  </span>
                </div>
              )}
            </div>
            {typeof brief.price === "number" && (
              <div className="flex items-center gap-1 font-semibold text-green-600 mt-1">
                <DollarSign className="h-3 w-3" />
                <span>${brief.price}</span>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => onOpenBrief(brief)}>
              {type === "open" ? "Open Brief" : "View Details"}
            </Button>
          </CardFooter>
        </Card>
      );
      })}
    </div>
  );
}
