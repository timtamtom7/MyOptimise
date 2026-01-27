import { createClient } from "@/utils/supabase/server";
import { MixingBoard } from "@/components/dashboard/admin/mixing-board";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Permission Mixing Board | Optimise",
};

export default async function PermissionsPage() {
  const supabase = await createClient();

  // 1. Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Fetch data in parallel
  const [
    { data: users, error: usersError },
    { data: capabilities, error: capsError },
    { data: userCapabilities, error: userCapsError }
  ] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, role, avatar_url").order('full_name'),
    supabase.from("capabilities").select("*").order('category', { ascending: true }).order('name', { ascending: true }),
    supabase.from("user_capabilities").select("user_id, capability_id, granted")
  ]);

  if (usersError || capsError || userCapsError) {
      console.error("Error fetching permission data", { usersError, capsError, userCapsError });
      return <div>Error loading permission data. Please check logs.</div>;
  }

  return (
    <div className="h-full flex flex-col p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permission Mixing Board</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Fine-grained access control matrix (&quot;God Mode&quot;). Toggle individual capabilities for each user.
        </p>
      </div>

      <MixingBoard 
        users={users || []} 
        capabilities={capabilities || []} 
        userCapabilities={userCapabilities || []} 
      />
    </div>
  );
}
