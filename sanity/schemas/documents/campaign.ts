import { defineField, defineType } from "sanity";
import { Flag } from "lucide-react";

export default defineType({
  name: "campaign",
  type: "document",
  title: "Campaign",
  icon: Flag,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Campaign Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      options: {
        filter: 'type == "client"',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Planned", value: "planned" },
          { title: "Active", value: "active" },
          { title: "Paused", value: "paused" },
          { title: "Completed", value: "completed" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "planned",
    }),
    defineField({
      name: "startDate",
      type: "datetime",
      title: "Start Date",
    }),
    defineField({
      name: "endDate",
      type: "datetime",
      title: "End Date",
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description/Objectives",
    }),
    defineField({
      name: "budget",
      type: "number",
      title: "Budget",
    }),
    defineField({
        name: "manager",
        type: "reference",
        title: "Account Manager",
        to: [{ type: "account" }],
    })
  ],
  preview: {
    select: {
      title: "title",
      client: "client.name",
      status: "status",
    },
    prepare({ title, client, status }) {
      return {
        title,
        subtitle: `${client || "No Client"} • ${status}`,
      };
    },
  },
});
