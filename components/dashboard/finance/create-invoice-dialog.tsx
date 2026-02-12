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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInvoice } from "@/app/actions/finance";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Client {
  _id: string;
  name: string;
}

export function CreateInvoiceDialog({ clients }: { clients: Client[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      await createInvoice(formData);
      toast.success("Invoice created successfully");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 px-8 rounded-[2rem] font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all">
          <Plus className="mr-2 h-5 w-5" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <div className="relative bg-slate-50 dark:bg-slate-900/50 px-8 py-8 border-b border-slate-100 dark:border-slate-800/50">
             <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create Invoice</DialogTitle>
                <DialogDescription className="text-base font-medium mt-1">
                Create a new invoice for a client.
                </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-6 p-8 pt-6">
            <div className="grid gap-3">
              <Label htmlFor="client" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">
                Client
              </Label>
              <div className="col-span-3">
                <Select name="clientId" required>
                  <SelectTrigger className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="rounded-[2rem] p-3 shadow-2xl">
                    {clients.map((client) => (
                      <SelectItem key={client._id} value={client._id} className="rounded-2xl py-4 px-4 cursor-pointer text-base font-medium mb-1">
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3">
              <Label htmlFor="amount" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">
                Amount
              </Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg"
                required
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="dueDate" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">
                Due Date
              </Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg"
                required
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="note" className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300">
                Note
              </Label>
              <Input
                id="note"
                name="note"
                className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all px-6 font-medium text-lg"
                placeholder="Optional"
              />
            </div>
          </div>
          <DialogFooter className="px-8 pb-8 sm:justify-between gap-4">
             <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="h-16 rounded-[2rem] px-8 text-lg font-bold">
                Cancel
             </Button>
            <Button type="submit" disabled={loading} className="h-16 rounded-[2rem] px-10 text-lg font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto">
              {loading ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
