import { defineField, defineType } from "sanity";
import { Activity } from "lucide-react";

export default defineType({
  name: "auditLog",
  type: "document",
  title: "Audit Log",
  icon: Activity,
  fields: [
    defineField({ name: "action", type: "string", title: "Action", validation: (Rule) => Rule.required() }),
    defineField({ name: "createdAt", type: "datetime", title: "Created At", validation: (Rule) => Rule.required() }),
    defineField({ name: "actor", type: "reference", title: "Actor", to: [{ type: "account" }] }),
    defineField({
      name: "target",
      type: "reference",
      title: "Target",
      to: [
        { type: "account" },
        { type: "workItem" },
        { type: "clientRequest" },
        { type: "messageThread" },
        { type: "announcement" },
        { type: "feedback" },
        { type: "featureFlag" },
        { type: "analyticsRecord" },
        { type: "analyticsNote" },
        { type: "analyticsIngestionConfig" },
        { type: "invoice" },
        { type: "billingProfile" },
      ],
    }),
    defineField({ name: "targetType", type: "string", title: "Target Type" }),
    defineField({ name: "targetLabel", type: "string", title: "Target Label" }),
    defineField({ name: "context", type: "text", title: "Context" }),
  ],
});
