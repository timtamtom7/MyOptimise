import { defineField, defineType } from "sanity";
import { Receipt } from "lucide-react";

export default defineType({
  name: "invoice",
  type: "document",
  title: "Invoice",
  icon: Receipt,
  fields: [
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "invoiceNumber",
      type: "string",
      title: "Invoice Number",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: { list: ["draft", "sent", "paid", "void"], layout: "radio" },
      initialValue: "draft",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "currency",
      type: "string",
      title: "Currency",
      initialValue: "USD",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "amount",
      type: "number",
      title: "Amount",
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "issuedDate", type: "date", title: "Issued Date" }),
    defineField({ name: "dueDate", type: "date", title: "Due Date" }),
    defineField({
      name: "note",
      type: "text",
      title: "Note",
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      title: "Created At",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    }),
    defineField({ name: "updatedAt", type: "datetime", title: "Updated At", readOnly: true }),
    defineField({
      name: "createdBy",
      type: "reference",
      title: "Created By",
      to: [{ type: "account" }],
    }),
  ],
});

