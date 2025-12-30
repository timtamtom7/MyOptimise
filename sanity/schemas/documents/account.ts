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
      options: { list: [{ title: "Admin", value: "admin" }, { title: "Manager", value: "manager" }, { title: "Employee", value: "employee" }, { title: "Client", value: "client" }], layout: "radio" },
      initialValue: "employee",
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: { list: [{ title: "Active", value: "active" }, { title: "Disabled", value: "disabled" }], layout: "radio" },
      initialValue: "active",
    }),
    defineField({
      name: "capabilities",
      type: "array",
      title: "Extra Capabilities",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "revokedCapabilities",
      type: "array",
      title: "Revoked Capabilities",
      of: [{ type: "string" }],
    }),
    defineField({ name: "avatar", type: "image", title: "Avatar" }),
    defineField({ name: "timezone", type: "string", title: "Timezone" }),
    defineField({ name: "locale", type: "string", title: "Locale" }),
    defineField({
      name: "notificationPreferences",
      type: "object",
      title: "Notification Preferences",
      fields: [
        defineField({ name: "emailUpdates", type: "boolean", title: "Email Updates", initialValue: true }),
        defineField({ name: "inAppUpdates", type: "boolean", title: "In-App Updates", initialValue: true }),
      ],
    }),
    defineField({ name: "sessionVersion", type: "number", title: "Session Version", initialValue: 1 }),
    defineField({ name: "lastLoginAt", type: "datetime", title: "Last Login At" }),
    defineField({
      name: "loginHistory",
      type: "array",
      title: "Login History",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "provider", type: "string", title: "Provider" }),
            defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
          ],
        },
      ],
    }),
    defineField({ name: "passwordHash", type: "string", title: "Password Hash", description: "Only for Credentials login" }),
    defineField({ name: "notes", type: "text", title: "Notes" }),
  ],
});
