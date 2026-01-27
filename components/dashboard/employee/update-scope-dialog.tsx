"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { updateClientScope } from "@/app/actions/clients";
import { Edit } from "lucide-react";
import { toast } from "sonner";

interface UpdateScopeDialogProps {
  clientId: string;
  currentScope: string;
}

export function UpdateScopeDialog({ clientId, currentScope }: UpdateScopeDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState(currentScope);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await updateClientScope(formData);
      toast.success("Service scope updated successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to update scope");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="mr-2 h-4 w-4" />
          Edit Scope
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Update Service Scope</DialogTitle>
            <DialogDescription>
              Define the high-level strategy and deliverables for this client.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="scope">Scope Description</Label>
              <Textarea
                id="scope"
                name="scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                placeholder="E.g., Monthly SEO content, weekly newsletter..."
                className="h-32"
                required
              />
              <input type="hidden" name="clientId" value={clientId} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
