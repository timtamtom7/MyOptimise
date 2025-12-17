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
      name: "slug",
      type: "slug",
      title: "Slug",
      group: "details",
      options: { source: "name", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "description", type: "text", title: "Description", group: "content" }),
    defineField({ name: "contactEmail", type: "string", title: "Contact Email", group: "details" }),
    defineField({ name: "website", type: "url", title: "Website", group: "details" }),
    defineField({ name: "logo", type: "image", title: "Logo", group: "details" }),
  ],
});

