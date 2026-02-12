"use client";

import { useState, useEffect } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight, Instagram, Linkedin, Video, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { updateContentSchedule } from "@/app/actions/content";
import { toast } from "sonner";
import { createPortal } from "react-dom";

type ContentItem = {
  _id: string;
  title: string;
  platform: string;
  status: string;
  scheduledAt?: string;
  caption?: string;
  media?: any[];
  client?: { _id: string; businessName?: string; name?: string };
};

interface ContentCalendarViewProps {
  items: ContentItem[];
  onSelectItem: (item: ContentItem) => void;
}

function DraggableItem({ item, children, onClick }: { item: ContentItem; children: React.ReactNode; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item._id,
    data: { item },
  });

  return (
    <div 
      ref={setNodeRef} 
      {...listeners} 
      {...attributes} 
      onClick={(e) => {
        // Prevent click if it was a drag
        if (!isDragging && onClick) onClick();
      }}
      className={cn(
        "touch-none cursor-grab active:cursor-grabbing", 
        isDragging ? "opacity-30" : ""
      )}
    >
      {children}
    </div>
  );
}

function DroppableDay({ date, children, className }: { date: Date; children: React.ReactNode; className?: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id: date.toISOString(),
    data: { date },
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        className, 
        isOver && "bg-blue-50/50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-500/20 transition-all duration-200"
      )}
    >
      {children}
    </div>
  );
}

export function ContentCalendarView({ items: initialItems, onSelectItem }: ContentCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [items, setItems] = useState(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const itemId = active.id as string;
    const dropDateIso = over.id as string;
    const dropDate = new Date(dropDateIso);
    const item = active.data.current?.item as ContentItem;

    if (!item) return;

    // Calculate new date with time preservation
    let newDate = new Date(dropDate);
    if (item.scheduledAt) {
        const original = new Date(item.scheduledAt);
        newDate.setHours(original.getHours(), original.getMinutes());
    } else {
        newDate.setHours(9, 0);
    }

    // Optimistic update
    const originalItems = [...items];
    setItems(prev => prev.map(i => {
        if (i._id === itemId) {
            return { ...i, scheduledAt: newDate.toISOString(), status: 'scheduled' };
        }
        return i;
    }));

    try {
        await updateContentSchedule(itemId, newDate.toISOString());
        toast.success("Rescheduled", {
            description: `${item.title} moved to ${format(newDate, "MMM d")}`
        });
    } catch (e) {
        console.error(e);
        toast.error("Failed to reschedule");
        setItems(originalItems); // Revert
    }
  };

  const getItemsForDay = (date: Date) => {
    return items.filter((item) => {
      if (!item.scheduledAt) return false;
      const itemDate = new Date(item.scheduledAt);
      return isSameDay(itemDate, date);
    });
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram": return <Instagram className="h-3 w-3" />;
      case "linkedin": return <Linkedin className="h-3 w-3" />;
      case "tiktok": return <Video className="h-3 w-3" />;
      default: return <FileText className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "scheduled": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "client_review": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "internal_review": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  const activeItem = activeId ? items.find(i => i._id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <Button onClick={goToToday} variant="outline" className="rounded-full px-6 font-bold">
          Today
        </Button>
      </div>

      {/* Days Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr] overflow-hidden">
        {/* Day Names */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="py-4 text-center font-bold text-sm text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
            {day}
          </div>
        ))}

        {/* Dates */}
        <div className="col-span-7 grid grid-cols-7 auto-rows-fr overflow-y-auto">
          {days.map((day, dayIdx) => {
            const dayItems = getItemsForDay(day);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <DroppableDay
                key={day.toString()}
                date={day}
                className={cn(
                  "min-h-[140px] p-2 border-b border-r border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-900/50",
                  !isCurrentMonth && "bg-slate-50/30 dark:bg-slate-900/30 text-slate-400"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={cn(
                      "text-sm font-bold h-8 w-8 flex items-center justify-center rounded-full",
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayItems.length > 0 && (
                     <span className="text-xs font-bold text-slate-400">{dayItems.length} items</span>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  {dayItems.map((item) => (
                    <DraggableItem key={item._id} item={item} onClick={() => onSelectItem(item)}>
                        <div
                        className={cn(
                            "w-full text-left p-2 rounded-xl text-xs font-medium border border-transparent transition-all hover:scale-[1.02] hover:shadow-sm shadow-sm",
                            getStatusColor(item.status)
                        )}
                        >
                        <div className="flex items-center gap-1.5 mb-1">
                            {getPlatformIcon(item.platform)}
                            <span className="truncate flex-1">{item.client?.name || "Client"}</span>
                        </div>
                        <div className="truncate font-bold opacity-90">{item.title}</div>
                        </div>
                    </DraggableItem>
                  ))}
                </div>
              </DroppableDay>
            );
          })}
        </div>
      </div>
    </div>
    {createPortal(
        <DragOverlay>
          {activeItem ? (
            <div
              className={cn(
                "w-48 text-left p-2 rounded-xl text-xs font-medium border border-transparent shadow-2xl scale-105 rotate-2 cursor-grabbing",
                getStatusColor(activeItem.status)
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {getPlatformIcon(activeItem.platform)}
                <span className="truncate flex-1">{activeItem.client?.name || "Client"}</span>
              </div>
              <div className="truncate font-bold opacity-90">{activeItem.title}</div>
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
