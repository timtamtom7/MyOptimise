import { defineField, defineType } from "sanity";
import { Package } from "lucide-react";

export default defineType({
  name: "deliverable",
  type: "document",
  title: "Deliverable",
  icon: Package,
  groups: [
    { name: "details", title: "Details" },
    { name: "schedule", title: "Schedule" },
    { name: "content", title: "Content" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Deliverable Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "campaign",
      type: "reference",
      title: "Campaign",
      to: [{ type: "campaign" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      type: "string",
      title: "Type",
      options: {
        list: [
          { title: "Video", value: "video" },
          { title: "Image", value: "image" },
          { title: "Copy", value: "copy" },
          { title: "Strategy", value: "strategy" },
          { title: "Report", value: "report" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Drafting", value: "drafting" },
          { title: "Internal Review", value: "internal_review" },
          { title: "Client Review", value: "client_review" },
          { title: "Approved", value: "approved" },
          { title: "Changes Requested", value: "changes_requested" },
        ],
        layout: "radio",
      },
      initialValue: "drafting",
    }),
    defineField({
      name: "dueDate",
      type: "datetime",
      title: "Due Date",
      group: "schedule",
    }),
    defineField({
      name: "assignedTo",
      type: "reference",
      title: "Lead Assignee",
      to: [{ type: "account" }],
      group: "details",
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
      group: "details",
    }),
    defineField({
      name: "versionHistory",
      type: "array",
      title: "Version History",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "versionNumber", type: "number", title: "Version Number" }),
            defineField({ name: "file", type: "file", title: "File" }),
            defineField({ name: "url", type: "url", title: "External Link" }),
            defineField({ name: "notes", type: "text", title: "Notes" }),
            defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
            defineField({ name: "createdBy", type: "reference", to: [{ type: "account" }], title: "Created By" }),
          ],
        },
      ],
    }),
    defineField({
      name: "feedback",
      type: "array",
      title: "Client Feedback",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "content", type: "text", title: "Content" }),
            defineField({ name: "author", type: "reference", to: [{ type: "account" }], title: "Author" }),
            defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
      campaign: "campaign.title",
      status: "status",
    },
    prepare({ title, campaign, status }) {
      return {
        title,
        subtitle: `${campaign || "No Campaign"} • ${status}`,
      };
    },
  },
});
