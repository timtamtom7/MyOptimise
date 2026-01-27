"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface BriefBuilderProps {
  editors: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function BriefBuilder({ editors, action, onCancel }: BriefBuilderProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
      setIsSubmitting(true);
      try {
          await action(formData);
          toast.success("Brief created successfully");
          onCancel();
      } catch (error) {
          console.error(error);
          toast.error("Failed to create brief");
      } finally {
          setIsSubmitting(false);
      }
  }

  return (
    <form action={handleSubmit} className="space-y-6 border p-6 rounded-md bg-card text-card-foreground shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Create New Brief</h2>
        <p className="text-sm text-muted-foreground">Fill in the details for the editor.</p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="e.g. Viral Hook Video #1" disabled={isSubmitting} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="hook">Hook</Label>
          <Textarea id="hook" name="hook" placeholder="The first 3 seconds..." disabled={isSubmitting} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="script">Script</Label>
          <Textarea id="script" name="script" className="min-h-[150px]" placeholder="Full script..." disabled={isSubmitting} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="visual_direction">Visual Direction</Label>
          <Textarea id="visual_direction" name="visual_direction" placeholder="B-roll, style, etc." disabled={isSubmitting} />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="assets_url">Assets URL</Label>
          <Input id="assets_url" name="assets_url" placeholder="Google Drive / Dropbox link" disabled={isSubmitting} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="assignee_id">Assign To (Editor)</Label>
            <Select name="assignee_id" required disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select Editor" />
              </SelectTrigger>
              <SelectContent>
                {editors.map((editor) => (
                  <SelectItem key={editor.id} value={editor.id}>
                    {editor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
             <Label htmlFor="price">Price ($)</Label>
             <Input id="price" name="price" type="number" min="0" defaultValue="0" disabled={isSubmitting} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Brief
        </Button>
      </div>
    </form>
  );
}
