"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleCapability(userId: string, capabilityId: string, granted: boolean) {
  const supabase = await createClient();
  
  // 1. Get the target user's organization_id to maintain consistency
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    throw new Error("User profile not found");
  }

  // 2. Perform the update
  if (granted) {
    // Grant
    const { error } = await supabase
      .from("user_capabilities")
      .upsert({ 
        user_id: userId, 
        capability_id: capabilityId,
        organization_id: profile.organization_id,
        granted: true,
        granted_by: (await supabase.auth.getUser()).data.user?.id
      }, { onConflict: 'user_id, capability_id' }); // Assuming unique constraint exists

    if (error) throw error;
  } else {
    // Revoke (set granted = false or delete)
    // Deleting is cleaner if we treat absence as "false"
    const { error } = await supabase
      .from("user_capabilities")
      .delete()
      .match({ user_id: userId, capability_id: capabilityId });

    if (error) throw error;
  }

  revalidatePath("/dashboard/admin/permissions");
}
