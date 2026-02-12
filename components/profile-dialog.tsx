"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSelf } from "@/app/actions/user";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/use-translation";
import { Loader2, User, Mail, Image as ImageIcon, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  async function onSubmit(formData: FormData) {
    setLoading(true);
    await updateSelf(formData);
    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl bg-white dark:bg-slate-950 sm:max-w-[600px]">
        
        {/* Header with Blue Gradient */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 px-8 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
            <DialogHeader className="relative z-10">
                <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-xl">
                    <User className="h-8 w-8 text-white" />
                </div>
                <DialogTitle className="text-3xl font-black text-white">{t('editProfile')}</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium mt-1 text-base">
                    {t('editProfileDesc')}
                </DialogDescription>
            </DialogHeader>
        </div>

        <form action={onSubmit} className="p-8 space-y-8">
          <div className="space-y-6">
              
              {/* Email (Read Only) */}
              <div className="space-y-3">
                <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-500" />
                    {t('emailAddress')}
                </Label>
                <Input 
                    value={session?.user?.email || ""} 
                    readOnly 
                    disabled 
                    className="h-16 rounded-[2rem] bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 font-medium px-6 text-lg" 
                />
              </div>

              {/* Name */}
              <div className="space-y-3">
                <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    {t('name')}
                </Label>
                <Input 
                    name="name" 
                    defaultValue={session?.user?.name || ""} 
                    placeholder={t('namePlaceholder')} 
                    className="h-16 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium px-6 text-lg transition-all" 
                />
              </div>

              {/* Avatar */}
              <div className="space-y-3">
                <Label className="text-base font-bold ml-2 text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                    {t('avatar')}
                </Label>
                <div className="flex items-center gap-4">
                    <Input 
                        type="file" 
                        name="avatar" 
                        accept="image/*" 
                        className="h-16 pt-4 rounded-[2rem] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-medium file:mr-6 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-all px-6"
                    />
                </div>
              </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                className="h-14 px-6 rounded-[2rem] font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
                {t('cancel')}
            </Button>
            <Button 
                type="submit" 
                disabled={loading}
                className="h-14 px-8 rounded-[2rem] font-bold shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 bg-blue-600 hover:bg-blue-700 text-white min-w-[160px]"
            >
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {t('saveChanges')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
