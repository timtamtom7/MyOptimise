"use server";

import { safeGetServerSession } from "@/lib/auth";
import { fetchSanityAccountByEmail } from "@/sanity/lib/fetch";
import { client } from "@/sanity/lib/client";
import { hasAccountCapability } from "@/lib/capabilities";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function updateEmployee(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;

  // Managers and Admins can update employees
  if (acct.type !== "manager" && acct.type !== "admin") return;
  
  // Verify capability (admin has all, manager needs specific)
  if (acct.type === "manager" && !hasAccountCapability(acct, "users.invite")) return;

  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const password = String(formData.get("password") || "").trim();
  
  if (!id || !name || !status) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  // Ensure target is an employee (Managers can't edit Admins/Managers)
  const target = await writeClient.fetch(`*[_type == "account" && _id == $id][0]`, { id });
  if (!target) return;
  
  // Managers can only edit employees. Admins can edit anyone.
  if (acct.type !== "admin" && target.type !== "employee") return;

  const patchData: any = {
    name,
    role: role || undefined,
    status,
    updatedAt: new Date().toISOString()
  };

  // If Admin, allow updating the account type based on role selection
  if (acct.type === "admin" && role && ["admin", "manager", "employee"].includes(role)) {
      patchData.type = role;
  }

  if (password) {
    patchData.password = await bcrypt.hash(password, 10);
  }

  await writeClient.patch(id).set(patchData).commit();

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/manager");
}

export async function deleteEmployee(formData: FormData) {
  const session = await safeGetServerSession();
  const email = String((session as any)?.user?.email || "");
  if (!email) return;

  const acct = await fetchSanityAccountByEmail({ email });
  if (!acct || acct.status === "disabled") return;
  if (acct.type !== "manager" && acct.type !== "admin") return;
  if (acct.type === "manager" && !hasAccountCapability(acct, "users.invite")) return;

  const id = String(formData.get("id") || "").trim();
  if (!id) return;

  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;
  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const target = await writeClient.fetch(`*[_type == "account" && _id == $id][0]`, { id });
  if (!target) return;
  
  // Managers can only delete employees. Admins can delete anyone.
  if (acct.type !== "admin" && target.type !== "employee") return;

  await writeClient.delete(id);

  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard/manager");
}
