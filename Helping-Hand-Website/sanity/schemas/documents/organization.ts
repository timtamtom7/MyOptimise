import { defineField, defineType } from "sanity";
import { Building2 } from "lucide-react";

export default defineType({
  name: "organization",
  type: "document",
  title: "Organization",
  icon: Building2,
  groups: [
    { name: "content", title: "Content" },
    { name: "details", title: "Details" },
  ],
  fields: [
    defineField({ name: "name", type: "string", title: "Name", group: "content", validation: (Rule) => Rule.required() }),
    defineField({
      name: "name_i18n",
      title: "Name (Translations)",
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
      title: "Slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", type: "text", title: "Description", group: "content" }),
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
    defineField({ name: "contactEmail", type: "string", title: "Contact Email", group: "details" }),
    defineField({ name: "website", type: "url", title: "Website", group: "details" }),
    defineField({ name: "logo", type: "image", title: "Logo", group: "details" }),
  ],
});
