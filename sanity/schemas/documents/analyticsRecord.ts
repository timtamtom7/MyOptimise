import { defineField, defineType } from "sanity";
import { BarChart3 } from "lucide-react";

export default defineType({
  name: "analyticsRecord",
  type: "document",
  title: "Analytics Record",
  icon: BarChart3,
  fields: [
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "service",
      type: "reference",
      title: "Service",
      to: [{ type: "clientService" }],
    }),
    defineField({
      name: "metric",
      type: "string",
      title: "Metric",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "value",
      type: "number",
      title: "Value",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "period",
      type: "string",
      title: "Period",
      options: { list: ["daily", "weekly", "monthly"], layout: "radio" },
      initialValue: "daily",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "metricDate",
      type: "date",
      title: "Metric Date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "note", type: "string", title: "Note" }),
    defineField({
      name: "visibility",
      type: "string",
      title: "Visibility",
      options: { list: ["client", "internal"], layout: "radio" },
      initialValue: "client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      title: "Created At",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
  ],
});

