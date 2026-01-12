import { defineField, defineType } from "sanity";
import { User } from "lucide-react";

export default defineType({
  name: "lead",
  type: "document",
  title: "Lead",
  icon: User,
  fields: [
    defineField({ name: "companyName", type: "string", title: "Company Name", validation: (Rule) => Rule.required() }),
    defineField({ name: "contactName", type: "string", title: "Contact Name" }),
    defineField({ name: "email", type: "string", title: "Email" }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Cold", value: "cold" },
          { title: "Contacted", value: "contacted" },
          { title: "Discovery Call", value: "discovery" },
          { title: "Proposal Sent", value: "proposal" },
          { title: "Negotiation", value: "negotiation" },
          { title: "Won", value: "won" },
          { title: "Lost", value: "lost" },
        ],
        layout: "radio"
      },
      initialValue: "cold",
    }),
    defineField({ name: "value", type: "number", title: "Estimated Value" }),
    defineField({ name: "notes", type: "text", title: "Notes" }),
    defineField({
      name: "assignedTo",
      type: "reference",
      to: [{ type: "account" }],
      title: "Assigned To",
    }),
    defineField({
      name: "transcriptions",
      type: "array",
      title: "Call Transcriptions",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "date", type: "datetime", title: "Date" }),
            defineField({ name: "summary", type: "text", title: "Summary" }),
            defineField({ name: "sentiment", type: "string", title: "Sentiment" }),
            defineField({ name: "actionItems", type: "array", of: [{ type: "string" }] }),
          ]
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: "companyName",
      subtitle: "status",
    },
  },
});
