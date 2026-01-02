import { defineField, defineType } from "sanity";
import { StickyNote } from "lucide-react";

export default defineType({
  name: "analyticsNote",
  type: "document",
  title: "Analytics Note",
  icon: StickyNote,
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
      name: "author",
      type: "reference",
      title: "Author",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "message",
      type: "text",
      title: "Message",
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

