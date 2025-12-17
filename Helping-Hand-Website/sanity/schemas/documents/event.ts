import { defineField, defineType } from "sanity";
import { CalendarDays } from "lucide-react";

export default defineType({
  name: "event",
  type: "document",
  title: "Event",
  icon: CalendarDays,
  groups: [
    { name: "content", title: "Content" },
    { name: "details", title: "Details" },
    { name: "status", title: "Status" },
  ],
  fields: [
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      group: "content",
    }),
    defineField({ name: "title", type: "string", group: "content", validation: (Rule) => Rule.required() }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", group: "content" }),
    defineField({ name: "date", title: "Date", type: "datetime", group: "details", validation: (Rule) => Rule.required() }),
    defineField({ name: "location", title: "Location", type: "string", group: "details" }),
    defineField({ name: "capacity", title: "Capacity", type: "number", group: "details" }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      group: "details",
      options: {
        list: [
          { title: "Food Distribution", value: "food" },
          { title: "Elderly Support", value: "elderly" },
          { title: "Community", value: "community" },
        ],
      },
    }),
    defineField({
      name: "organization",
      title: "Organization",
      type: "reference",
      to: [{ type: "organization" }],
      group: "details",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "status",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending Review", value: "pending_review" },
          { title: "Approved", value: "approved" },
          { title: "Completed", value: "completed" },
        ],
        layout: "radio",
      },
      initialValue: "pending_review",
      validation: (Rule) => Rule.required(),
    }),
  ],
});
