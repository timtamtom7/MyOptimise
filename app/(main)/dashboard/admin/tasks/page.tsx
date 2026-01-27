import { TaskBoard } from "@/components/dashboard/task-board";

export const dynamic = "force-dynamic";

export default function AdminTasksPage() {
  return (
    <div className="p-6">
      <TaskBoard />
    </div>
  );
}
