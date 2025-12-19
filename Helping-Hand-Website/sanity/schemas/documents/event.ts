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
      name: "title_i18n",
      title: "Title (Translations)",
      type: "object",
      group: "content",
      fields: [
        { name: "en", type: "string", title: "English" },
        { name: "zh_hk", type: "string", title: "中文（粵語）" },
        { name: "zh_cn", type: "string", title: "中文（普通话）" },
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "details",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", title: "Description", type: "text", group: "content" }),
    defineField({
      name: "description_i18n",
      title: "Description (Translations)",
      type: "object",
      group: "content",
      fields: [
        { name: "en", type: "text", title: "English" },
        { name: "zh_hk", type: "text", title: "中文（粵語）" },
        { name: "zh_cn", type: "text", title: "中文（普通话）" },
      ],
    }),
    defineField({ name: "date", title: "Date", type: "datetime", group: "details", validation: (Rule) => Rule.required() }),
    defineField({ name: "location", title: "Location", type: "string", group: "details" }),
    defineField({
      name: "location_i18n",
      title: "Location (Translations)",
      type: "object",
      group: "details",
      fields: [
        { name: "en", type: "string", title: "English" },
        { name: "zh_hk", type: "string", title: "中文（粵語）" },
        { name: "zh_cn", type: "string", title: "中文（普通话）" },
      ],
    }),
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
