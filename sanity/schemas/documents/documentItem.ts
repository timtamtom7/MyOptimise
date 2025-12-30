import { defineField, defineType } from "sanity";
import { FileText } from "lucide-react";

export default defineType({
  name: "documentItem",
  type: "document",
  title: "Document",
  icon: FileText,
  groups: [
    { name: "content", title: "Content" },
    { name: "sharing", title: "Sharing" },
    { name: "meta", title: "Meta" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "folder",
      title: "Folder",
      type: "string",
      group: "content",
    }),
    defineField({
      name: "file",
      title: "File",
      type: "file",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "visibility",
      title: "Visibility",
      type: "string",
      group: "sharing",
      options: {
        list: [
          { title: "Internal", value: "internal" },
          { title: "Client Visible", value: "client" },
        ],
        layout: "radio",
      },
      initialValue: "internal",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sharedWith",
      title: "Shared With",
      type: "array",
      group: "sharing",
      of: [{ type: "reference", to: [{ type: "account" }] }],
    }),
    defineField({
      name: "createdBy",
      title: "Created By",
      type: "reference",
      to: [{ type: "account" }],
      group: "meta",
      readOnly: true,
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      group: "meta",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      group: "meta",
      readOnly: true,
    }),
  ],
});

