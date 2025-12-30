import { defineField, defineType } from "sanity";
import { MessageCircle } from "lucide-react";

export default defineType({
  name: "feedback",
  type: "document",
  title: "Feedback",
  icon: MessageCircle,
  fields: [
    defineField({
      name: "category",
      type: "string",
      title: "Category",
      options: {
        list: [
          { title: "Bug", value: "bug" },
          { title: "Feature request", value: "feature" },
          { title: "General", value: "general" },
        ],
        layout: "radio",
      },
      initialValue: "bug",
    }),
    defineField({ name: "message", type: "text", title: "Message", validation: (Rule) => Rule.required() }),
    defineField({ name: "url", type: "url", title: "URL" }),
    defineField({ name: "fromEmail", type: "string", title: "From Email" }),
    defineField({ name: "fromAccount", type: "reference", title: "From Account", to: [{ type: "account" }] }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "New", value: "new" },
          { title: "Triaged", value: "triaged" },
          { title: "Resolved", value: "resolved" },
        ],
        layout: "radio",
      },
      initialValue: "new",
    }),
    defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
  ],
});

