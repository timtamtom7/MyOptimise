"use client";

import { useState } from "react";
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date-formatting";

interface ScheduleItem {
  _id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  type: string;
  visibility: string;
  participants?: any[];
}

interface ScheduleViewProps {
  items: ScheduleItem[];
  currentUserId: string;
}

export function ScheduleView({ items, currentUserId }: ScheduleViewProps) {
  const [view, setView] = useState<"month" | "week" | "day">("week");
  const [date, setDate] = useState(new Date());

  const navigate = (direction: "prev" | "next") => {
    if (view === "week") {
      setDate(direction === "next" ? addWeeks(date, 1) : subWeeks(date, 1));
    } else if (view === "month") {
      setDate(direction === "next" ? addMonths(date, 1) : subMonths(date, 1));
    } else {
      setDate(direction === "next" ? addWeeks(date, 1) : subWeeks(date, 1)); // Day nav logic
    }
  };

  const days = view === "week" 
    ? eachDayOfInterval({ start: startOfWeek(date, { weekStartsOn: 1 }), end: endOfWeek(date, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }) });

  const getItemsForDay = (day: Date) => {
    return items.filter(item => {
      const start = new Date(item.startsAt);
      if (item.endsAt) {
        const end = new Date(item.endsAt);
        // Check if day is within the range [start, end]
        // We use isBefore/isAfter logic or compare timestamps
        // But need to handle day granularity
        const dayTime = day.getTime();
        const startTime = start.setHours(0,0,0,0);
        const endTime = end.setHours(23,59,59,999);
        
        return dayTime >= startTime && dayTime <= endTime;
      }
      return isSameDay(start, day);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold w-48 text-center">
            {formatDate(date, view === "month" ? "MMMM yyyy" : "MMM d, yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
           <Button variant={view === "month" ? "secondary" : "ghost"} onClick={() => setView("month")}>Month</Button>
           <Button variant={view === "week" ? "secondary" : "ghost"} onClick={() => setView("week")}>Week</Button>
        </div>
      </div>

      <div className={cn("grid gap-4", view === "month" ? "grid-cols-7" : "grid-cols-1 md:grid-cols-7")}>
        {days.map((day) => {
          const dayItems = getItemsForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, date);

          if (view === "month" && !isCurrentMonth) return <div key={day.toISOString()} className="opacity-20 bg-muted rounded-md p-2 min-h-[100px]" />;

          return (
            <Card key={day.toISOString()} className={cn("min-h-[150px]", isToday && "border-primary")}>
              <CardHeader className="p-3 pb-2 space-y-0">
                <CardTitle className={cn("text-sm font-medium", !isCurrentMonth && "text-muted-foreground")}>
                  {formatDate(day, "EEE d")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2">
                {dayItems.length === 0 && <div className="text-xs text-muted-foreground pt-4 text-center">-</div>}
                {dayItems.map((item) => (
                  <div key={item._id} className="text-xs border rounded p-1.5 bg-card hover:bg-accent transition-colors cursor-pointer">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-muted-foreground">
                       <span className="flex items-center gap-0.5">
                         <Clock className="h-3 w-3" />
                         {formatDate(item.startsAt, "HH:mm")}
                       </span>
                       {item.type === "team" && <Users className="h-3 w-3" />}
                    </div>
                    <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1">{item.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
