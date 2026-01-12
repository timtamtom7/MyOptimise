"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isSameDay, isSameMonth, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import { Calendar as CalendarIcon, Flag, Package, CheckCircle2, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlatformIcon } from "./content-grid";
import { updateContentSchedule } from "@/app/actions/content";
import { toast } from "sonner";
import { formatDate } from "@/lib/date-formatting";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  endDate?: string; // For campaigns
  type: 'campaign' | 'deliverable' | 'approval' | 'content';
  status?: string;
  description?: string;
  platform?: string;
  postType?: string;
}

interface ClientCalendarProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  drafts?: any[];
  targetTimezone?: string;
}

export function ClientCalendar({ events, onDateClick, onEventClick, drafts = [], targetTimezone }: ClientCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedId, setDraggedId] = useState<string | null>(null);

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

  async function scheduleDrop(eventId: string, dropDayIso: string) {
    let ev = events.find(e => e.id === eventId);
    
    // If not found in events, check drafts
    if (!ev) {
        const draft = drafts.find(d => d._id === eventId);
        if (draft) {
             ev = { 
                 id: draft._id, 
                 type: 'content', 
                 title: draft.title,
                 date: new Date().toISOString(),
                 platform: draft.platform,
                 postType: draft.postType
             } as CalendarEvent; 
        }
    }

    if (!ev || ev.type !== "content") return;
    
    let timePart = "09:00";
    try {
      // Only preserve time if it was already scheduled
      if (events.some(e => e.id === eventId)) {
          const original = parseISO(ev.date);
          timePart = formatDate(original, "HH:mm");
      }
    } catch {}
    
    const newDate = `${dropDayIso}T${timePart}`;
    try {
        await updateContentSchedule(eventId, newDate);
        toast.success("Content scheduled");
    } catch (e) {
        console.error(e);
        toast.error("Failed to schedule content");
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-base font-medium">
            {formatDate(currentDate, "MMMM yyyy")}
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
                  <DayCell 
                    key={day.toISOString()}
                    day={day}
                    isTodayDate={isTodayDate}
                    events={dayEvents}
                    onDateClick={onDateClick}
                    onEventClick={onEventClick}
                    draggedId={draggedId}
                    onDropSchedule={scheduleDrop}
                    onDragEnd={() => setDraggedId(null)}
                  />
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
                        <div 
                          key={event.id} 
                          className={cn(
                            "flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0",
                            event.type === 'content' && "cursor-pointer hover:opacity-80 transition-opacity"
                          )}
                          onClick={() => event.type === 'content' && onEventClick?.(event.id)}
                        >
                            <div className={cn(
                                "mt-1 p-1.5 rounded-full",
                                event.type === 'campaign' && "bg-blue-100 text-blue-600",
                                event.type === 'deliverable' && "bg-green-100 text-green-600",
                                event.type === 'approval' && "bg-orange-100 text-orange-600",
                                event.type === 'content' && "bg-purple-100 text-purple-600",
                            )}>
                                {event.type === 'campaign' && <Flag className="h-4 w-4" />}
                                {event.type === 'deliverable' && <Package className="h-4 w-4" />}
                                {event.type === 'approval' && <CheckCircle2 className="h-4 w-4" />}
                                {event.type === 'content' && (event.platform ? <PlatformIcon platform={event.platform} /> : <Smartphone className="h-4 w-4" />)}
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{event.title}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <CalendarIcon className="h-3 w-3" />
                                    <span>
                                        {formatDate(event.date, "MMM d, yyyy")}
                                        {event.endDate && ` - ${formatDate(event.endDate, "MMM d, yyyy")}`}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Unscheduled Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(!drafts || drafts.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No drafts available.
                </div>
              )}
              {drafts.map((draft: any) => (
                <div 
                  key={draft._id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/event-id", draft._id);
                  }}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing hover:bg-muted/40",
                    "bg-card"
                  )}
                  title={draft.title}
                >
                  {draft.platform ? <PlatformIcon platform={draft.platform} /> : null}
                  <div className="text-sm truncate flex-1">
                    <div className="font-medium truncate">{draft.title || "Untitled"}</div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {draft.postType?.replace('_', ' ') || "draft"}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px] h-5">Draft</Badge>
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

function DayCell(props: {
  day: Date;
  isTodayDate: boolean;
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  draggedId: string | null;
  onDropSchedule: (eventId: string, dropDayIso: string) => Promise<void>;
  onDragEnd: () => void;
}) {
  const { day, isTodayDate, events, onDateClick, onEventClick, draggedId } = props;
  const dropDayIso = formatDate(day, "yyyy-MM-dd");
  const [isOver, setIsOver] = useState(false);

  return (
    <div 
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsOver(false);
        const id = e.dataTransfer.getData("text/event-id");
        if (id) props.onDropSchedule(id, dropDayIso).then(props.onDragEnd);
      }}
      onClick={() => onDateClick?.(day)}
      className={cn(
        "h-24 p-2 rounded-md border text-sm overflow-hidden flex flex-col gap-1 relative cursor-pointer transition-colors",
        isTodayDate ? "bg-accent/50 border-accent" : "bg-card hover:bg-accent/10",
        isOver && "bg-accent ring-2 ring-primary ring-inset border-primary"
      )}
    >
      <div className={cn(
        "font-medium mb-1 flex justify-between",
        isTodayDate && "text-primary"
      )}>
        {formatDate(day, "d")}
      </div>
      
      {events.slice(0, 3).map((event, i) => (
        <EventChip 
          key={`${event.id}-${i}`} 
          event={event} 
          onEventClick={onEventClick}
          dragged={props.draggedId === event.id}
        />
      ))}
      {events.length > 3 && (
        <div className="text-[10px] text-muted-foreground pl-1">
          +{events.length - 3} more
        </div>
      )}
    </div>
  );
}

function EventChip(props: {
  event: CalendarEvent;
  onEventClick?: (eventId: string) => void;
  dragged?: boolean;
}) {
  const { event, onEventClick, dragged } = props;
  return (
    <div 
      draggable={event.type === "content"}
      onDragStart={(e) => {
        if (event.type !== "content") return;
        setTimeout(() => {}, 0);
        e.dataTransfer.setData("text/event-id", event.id);
      }}
      onDragEnd={(e) => {
        e.preventDefault();
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (event.type === 'content') {
          onEventClick?.(event.id);
        }
      }}
      className={cn(
        "text-[10px] px-1.5 py-0.5 rounded truncate flex items-center gap-1 cursor-pointer hover:opacity-80",
        event.type === 'campaign' && "bg-blue-100 text-blue-700",
        event.type === 'deliverable' && "bg-green-100 text-green-700",
        event.type === 'approval' && "bg-orange-100 text-orange-700",
        event.type === 'content' && "bg-purple-100 text-purple-700",
        dragged && "opacity-60"
      )}
      title={event.title}
    >
      {event.type === 'content' && event.platform ? <PlatformIcon platform={event.platform} className="h-3 w-3" /> : null}
      <span className="truncate">{event.title}</span>
    </div>
  );
}
