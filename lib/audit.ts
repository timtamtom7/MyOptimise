import { client } from "@/sanity/lib/client";

const TARGET_REF_TYPES = new Set<string>([
  "account",
  "workItem",
  "clientRequest",
  "messageThread",
  "announcement",
  "feedback",
]);

export async function writeAuditLog(params: {
  actorAccountId?: string | null;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  targetLabel?: string | null;
  context?: unknown;
}) {
  const writeToken = process.env.SANITY_API_WRITE_TOKEN || "";
  if (!writeToken) return;

  const writeClient = client.withConfig({ token: writeToken, perspective: "published" });

  const createdAt = new Date().toISOString();
  const targetType = params.targetType ? String(params.targetType) : "";
  let context = "";
  if (params.context) {
    try {
      context = JSON.stringify(params.context).slice(0, 8000);
    } catch {
      context = "";
    }
  }

  const doc = {
    _type: "auditLog",
    action: params.action,
    createdAt,
    ...(params.actorAccountId ? { actor: { _type: "reference", _ref: String(params.actorAccountId) } } : {}),
    ...(targetType ? { targetType } : {}),
    ...(params.targetLabel ? { targetLabel: String(params.targetLabel) } : {}),
    ...(context ? { context } : {}),
  } as any;

  const targetId = params.targetId ? String(params.targetId) : "";
  if (targetId && TARGET_REF_TYPES.has(targetType)) {
    doc.target = { _type: "reference", _ref: targetId };
  }

  try {
    await writeClient.create(doc);
  } catch {
    return;
  }
}
