import { defineField, defineType } from "sanity";
import { Megaphone } from "lucide-react";

export default defineType({
  name: "announcement",
  type: "document",
  title: "Announcement",
  icon: Megaphone,
  fields: [
    defineField({ name: "title", type: "string", title: "Title", validation: (Rule) => Rule.required() }),
    defineField({ name: "message", type: "text", title: "Message", validation: (Rule) => Rule.required() }),
    defineField({
      name: "audience",
      type: "string",
      title: "Audience",
      options: {
        list: [
          { title: "All users", value: "all" },
          { title: "Internal only (admin/manager/employee)", value: "internal" },
          { title: "Clients only", value: "clients" },
        ],
        layout: "radio",
      },
      initialValue: "all",
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Published", value: "published" },
          { title: "Archived", value: "archived" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
    }),
    defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
    defineField({ name: "publishedAt", type: "datetime", title: "Published At" }),
    defineField({ name: "createdBy", type: "reference", title: "Created By", to: [{ type: "account" }] }),
  ],
});

