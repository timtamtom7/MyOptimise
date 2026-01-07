"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, isSameDay, isSameMonth, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { Calendar as CalendarIcon, Flag, Package, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  endDate?: string; // For campaigns
  type: 'campaign' | 'deliverable' | 'approval';
  status?: string;
  description?: string;
}

interface ClientCalendarProps {
  events: CalendarEvent[];
}

export function ClientCalendar({ events }: ClientCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseISO(event.date);
      if (event.type === 'campaign' && event.endDate) {
        const endDate = parseISO(event.endDate);
        return day >= eventDate && day <= endDate;
      }
      return isSameDay(eventDate, day);
    });
  };

  // Group upcoming events for list view
  const upcomingEvents = events
    .filter(e => {
        const d = parseISO(e.date);
        const now = new Date();
        now.setHours(0,0,0,0);
        if (e.endDate) return parseISO(e.endDate) >= now;
        return d >= now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-xs text-muted-foreground font-medium uppercase">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 bg-muted/20 rounded-md" />
            ))}
            {daysInMonth.map(day => {
              const dayEvents = getEventsForDay(day);
              const isTodayDate = isToday(day);
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "h-24 p-2 rounded-md border text-sm overflow-hidden flex flex-col gap-1 relative",
                    isTodayDate ? "bg-accent/50 border-accent" : "bg-card hover:bg-accent/10"
                  )}
                >
                  <div className={cn(
                    "font-medium mb-1 flex justify-between",
                    isTodayDate && "text-primary"
                  )}>
                    {format(day, "d")}
                  </div>
                  
                  {dayEvents.slice(0, 3).map((event, i) => (
                    <div 
                      key={`${event.id}-${i}`}
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded truncate",
                        event.type === 'campaign' && "bg-blue-100 text-blue-700",
                        event.type === 'deliverable' && "bg-green-100 text-green-700",
                        event.type === 'approval' && "bg-orange-100 text-orange-700",
                      )}
                      title={event.title}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Upcoming Key Dates</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {upcomingEvents.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            No upcoming events found.
                        </div>
                    )}
                    {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                            <div className={cn(
                                "mt-1 p-1.5 rounded-full",
                                event.type === 'campaign' && "bg-blue-100 text-blue-600",
                                event.type === 'deliverable' && "bg-green-100 text-green-600",
                                event.type === 'approval' && "bg-orange-100 text-orange-600",
                            )}>
                                {event.type === 'campaign' && <Flag className="h-4 w-4" />}
                                {event.type === 'deliverable' && <Package className="h-4 w-4" />}
                                {event.type === 'approval' && <CheckCircle2 className="h-4 w-4" />}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{event.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>
                                        {format(parseISO(event.date), "MMM d, yyyy")}
                                        {event.endDate && ` - ${format(parseISO(event.endDate), "MMM d, yyyy")}`}
                                    </span>
                                </div>
                                {event.status && (
                                    <Badge variant="secondary" className="text-[10px] px-1 h-5 capitalize">
                                        {event.status.replace('_', ' ')}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card className="bg-muted/30 border-dashed">
            <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                    <CalendarIcon className="h-8 w-8 text-muted-foreground/50" />
                    <h3 className="font-medium text-sm">Sync with your calendar</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px]">
                        Stay on top of deadlines by syncing your Optimise calendar.
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" disabled>
                        Coming Soon
                    </Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
