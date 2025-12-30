import { defineField, defineType } from "sanity";
import { Briefcase } from "lucide-react";

export default defineType({
  name: "clientService",
  type: "document",
  title: "Client Service",
  icon: Briefcase,
  groups: [
    { name: "meta", title: "Meta" },
    { name: "client", title: "Client" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "serviceType",
      type: "string",
      title: "Service Type",
      group: "meta",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "Facebook", value: "facebook" },
          { title: "Email", value: "email" },
          { title: "Website", value: "website" },
          { title: "Ads", value: "ads" },
          { title: "SEO", value: "seo" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
      },
      initialValue: "other",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "organization",
      type: "reference",
      title: "Organization",
      group: "meta",
      to: [{ type: "organization" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      group: "meta",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Paused", value: "paused" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "active",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "statusNote",
      type: "text",
      title: "Status Note",
      group: "meta",
    }),
    defineField({
      name: "clientCanToggle",
      type: "boolean",
      title: "Client Can Enable/Disable",
      group: "client",
      initialValue: false,
    }),
    defineField({
      name: "clientEnabled",
      type: "boolean",
      title: "Client Enabled",
      group: "client",
      initialValue: true,
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
      group: "meta",
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      readOnly: true,
      group: "meta",
    }),
  ],
});

