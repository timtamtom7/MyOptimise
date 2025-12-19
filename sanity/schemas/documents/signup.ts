import { defineField, defineType } from "sanity";
import { UserPlus } from "lucide-react";

export default defineType({
  name: "signup",
  type: "document",
  title: "Signup",
  icon: UserPlus,
  fields: [
    defineField({
      name: "event",
      title: "Event",
      type: "reference",
      to: [{ type: "event" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "name", type: "string", title: "Name", validation: (Rule) => Rule.required() }),
    defineField({ name: "email", type: "string", title: "Email", validation: (Rule) => Rule.required() }),
    defineField({ name: "phone", type: "string", title: "Phone" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Received", value: "received" },
          { title: "Confirmed", value: "confirmed" },
          { title: "Rejected", value: "rejected" },
          { title: "Cancelled", value: "cancelled" },
          { title: "Completed", value: "completed" },
        ],
        layout: "radio",
      },
      initialValue: "received",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({
      name: "proofMedia",
      title: "Proof of Distribution",
      type: "array",
      of: [
        { type: "image" },
        { type: "file" },
      ],
    }),
    defineField({
      name: "consent",
      title: "Consent to pictures",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "completedAt",
      title: "Completed At",
      type: "datetime",
      readOnly: true,
    }),
  ],
});
