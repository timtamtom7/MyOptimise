"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSelf } from "@/app/actions/user";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/hooks/use-translation";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editProfile')}</DialogTitle>
          <DialogDescription>{t('editProfileDesc')}</DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('emailAddress')}</Label>
            <Input value={session?.user?.email || ""} readOnly disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label>{t('name')}</Label>
            <Input name="name" defaultValue={session?.user?.name || ""} placeholder={t('namePlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label>{t('avatar')}</Label>
            <Input type="file" name="avatar" accept="image/*" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={loading}>{t('saveChanges')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
