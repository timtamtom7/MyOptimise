import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/date-formatting";

interface ScheduleItem {
  _id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  type: string;
}

interface ScheduleListProps {
  items: ScheduleItem[];
}

export function ScheduleList({ items }: ScheduleListProps) {
  const grouped = items.reduce((acc, item) => {
     const date = item.startsAt.split("T")[0];
     if (!acc[date]) acc[date] = [];
     acc[date].push(item);
     return acc;
  }, {} as Record<string, ScheduleItem[]>);

  const sortedDates = Object.keys(grouped).sort();

  return (
    <Card className="h-full flex flex-col">
       <CardHeader className="flex-none pb-2">
          <CardTitle className="text-base font-medium">Schedule</CardTitle>
       </CardHeader>
       <CardContent className="flex-1 overflow-y-auto p-4 pt-0 space-y-6">
          {sortedDates.length === 0 && (
             <div className="text-sm text-muted-foreground text-center py-4">Nothing scheduled.</div>
          )}
          {sortedDates.map(date => (
             <div key={date}>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                   {formatDate(date, "EEEE, MMM d")}
                </div>
                <div className="space-y-3">
                   {grouped[date].map(item => (
                      <div key={item._id} className="flex gap-3 items-start">
                         <div className="w-1 rounded-full bg-primary h-full min-h-[2rem]"></div>
                         <div>
                            <div className="text-sm font-medium leading-none">{item.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                               {formatDate(item.startsAt, "h:mm a")} - {formatDate(item.endsAt, "h:mm a")}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          ))}
       </CardContent>
    </Card>
  );
}
