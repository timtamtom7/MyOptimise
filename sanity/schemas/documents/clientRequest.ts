import { defineField, defineType } from "sanity";
import { MessageSquare } from "lucide-react";

export default defineType({
  name: "clientRequest",
  type: "document",
  title: "Client Request",
  icon: MessageSquare,
  groups: [
    { name: "content", title: "Content" },
    { name: "client", title: "Client" },
    { name: "collaboration", title: "Collaboration" },
    { name: "status", title: "Status" },
  ],
  fields: [
    defineField({
      name: "subject",
      type: "string",
      title: "Subject",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "message",
      type: "text",
      title: "Message",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      type: "string",
      title: "Category",
      group: "content",
      options: {
        list: [
          { title: "General Support", value: "support" },
          { title: "Report a Bug", value: "bug" },
          { title: "Feature Request", value: "feature" },
          { title: "Billing Question", value: "billing" },
          { title: "Other", value: "other" },
        ],
      },
      initialValue: "support",
    }),
    defineField({
      name: "priority",
      type: "string",
      title: "Priority",
      group: "status",
      options: {
        list: [
          { title: "Low", value: "low" },
          { title: "Medium", value: "medium" },
          { title: "High", value: "high" },
          { title: "Urgent", value: "urgent" },
        ],
      },
      initialValue: "medium",
    }),
    defineField({
      name: "clientEmail",
      type: "string",
      title: "Client Email",
      group: "client",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "clientAccount",
      type: "reference",
      title: "Client Account",
      to: [{ type: "account" }],
      group: "client",
      readOnly: true,
    }),
    defineField({
      name: "assignedTo",
      type: "reference",
      title: "Assigned To",
      to: [{ type: "account" }],
      group: "collaboration",
    }),
    defineField({
      name: "messages",
      title: "Messages",
      type: "array",
      group: "collaboration",
      of: [
        {
          type: "object",
          name: "clientRequestMessage",
          fields: [
            defineField({
              name: "author",
              title: "Author",
              type: "reference",
              to: [{ type: "account" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "visibility",
              title: "Visibility",
              type: "string",
              options: {
                list: [
                  { title: "Client Visible", value: "client" },
                  { title: "Internal", value: "internal" },
                ],
                layout: "radio",
              },
              initialValue: "client",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "message",
              title: "Message",
              type: "text",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "attachments",
              title: "Attachments",
              type: "array",
              of: [{ type: "file" }],
            }),
            defineField({
              name: "createdAt",
              title: "Created At",
              type: "datetime",
              initialValue: () => new Date().toISOString(),
              readOnly: true,
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "internalNotes",
      title: "Internal Notes",
      type: "text",
      group: "collaboration",
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "status",
      options: {
        list: [
          { title: "Submitted", value: "submitted" },
          { title: "In Review", value: "in_review" },
          { title: "Responded", value: "responded" },
          { title: "Closed", value: "closed" },
        ],
        layout: "radio",
      },
      initialValue: "submitted",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "statusHistory",
      title: "Status History",
      type: "array",
      group: "status",
      of: [
        {
          type: "object",
          name: "clientRequestStatusChange",
          fields: [
            defineField({
              name: "fromStatus",
              title: "From",
              type: "string",
              options: {
                list: [
                  { title: "Submitted", value: "submitted" },
                  { title: "In Review", value: "in_review" },
                  { title: "Responded", value: "responded" },
                  { title: "Closed", value: "closed" },
                ],
                layout: "radio",
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "toStatus",
              title: "To",
              type: "string",
              options: {
                list: [
                  { title: "Submitted", value: "submitted" },
                  { title: "In Review", value: "in_review" },
                  { title: "Responded", value: "responded" },
                  { title: "Closed", value: "closed" },
                ],
                layout: "radio",
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "changedBy",
              title: "Changed By",
              type: "reference",
              to: [{ type: "account" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "changedAt",
              title: "Changed At",
              type: "datetime",
              initialValue: () => new Date().toISOString(),
              readOnly: true,
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "response",
      title: "Response",
      type: "text",
      group: "status",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
      group: "status",
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      readOnly: true,
      group: "status",
    }),
    defineField({
      name: "respondedAt",
      title: "Responded At",
      type: "datetime",
      readOnly: true,
      group: "status",
    }),
  ],
});
