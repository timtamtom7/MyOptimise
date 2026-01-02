import { defineField, defineType } from "sanity";
import { CreditCard } from "lucide-react";

export default defineType({
  name: "billingProfile",
  type: "document",
  title: "Billing Profile",
  icon: CreditCard,
  fields: [
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "billingEmail", type: "string", title: "Billing Email" }),
    defineField({ name: "billingName", type: "string", title: "Billing Name" }),
    defineField({ name: "billingAddress", type: "text", title: "Billing Address" }),
    defineField({ name: "taxId", type: "string", title: "Tax ID" }),
    defineField({ name: "note", type: "text", title: "Note" }),
    defineField({
      name: "updatedAt",
      type: "datetime",
      title: "Updated At",
      readOnly: true,
    }),
  ],
});

