import { defineField, defineType } from "sanity";
import { PlugZap } from "lucide-react";

export default defineType({
  name: "analyticsIngestionConfig",
  type: "document",
  title: "Analytics Ingestion Config",
  icon: PlugZap,
  fields: [
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "provider",
      type: "string",
      title: "Provider",
      options: { list: ["manual", "other"], layout: "radio" },
      initialValue: "manual",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "enabled",
      type: "boolean",
      title: "Enabled",
      initialValue: false,
    }),
    defineField({ name: "note", type: "text", title: "Note" }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      title: "Updated At",
      readOnly: true,
    }),
  ],
});

