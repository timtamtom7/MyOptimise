import { defineField, defineType } from "sanity";
import { UserCog } from "lucide-react";

export default defineType({
  name: "account",
  type: "document",
  title: "Account",
  icon: UserCog,
  fields: [
    defineField({ name: "email", type: "string", title: "Email", validation: (Rule) => Rule.required() }),
    defineField({ name: "name", type: "string", title: "Name" }),
    defineField({
      name: "type",
      type: "string",
      title: "Type",
      options: { list: [{ title: "Individual", value: "individual" }, { title: "Business", value: "business" }, { title: "Admin", value: "admin" }], layout: "radio" },
      initialValue: "individual",
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: { list: [{ title: "Pending", value: "pending" }, { title: "Approved", value: "approved" }, { title: "Denied", value: "denied" }], layout: "radio" },
      initialValue: "pending",
    }),
    defineField({ name: "passwordHash", type: "string", title: "Password Hash", description: "Only for Credentials login" }),
    defineField({ name: "notes", type: "text", title: "Notes" }),
  ],
});
