import { defineField, defineType } from "sanity";
import { MessageSquare } from "lucide-react";

export default defineType({
  name: "messageThread",
  type: "document",
  title: "Message Thread",
  icon: MessageSquare,
  groups: [
    { name: "meta", title: "Meta" },
    { name: "participants", title: "Participants" },
    { name: "messages", title: "Messages" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      group: "meta",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "type",
      type: "string",
      title: "Type",
      group: "meta",
      options: {
        list: [
          { title: "Direct Message", value: "dm" },
          { title: "Group", value: "group" },
          { title: "Task", value: "task" },
          { title: "Support", value: "support" },
        ],
        layout: "radio",
      },
      initialValue: "dm",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "relatedWorkItem",
      title: "Related Work Item",
      type: "reference",
      to: [{ type: "workItem" }],
      group: "meta",
      hidden: ({ parent }) => String(parent?.type || "") !== "task",
    }),
    defineField({
      name: "relatedClientRequest",
      title: "Related Client Request",
      type: "reference",
      to: [{ type: "clientRequest" }],
      group: "meta",
      hidden: ({ parent }) => String(parent?.type || "") !== "support",
    }),
    defineField({
      name: "visibility",
      type: "string",
      title: "Visibility",
      group: "meta",
      options: {
        list: [
          { title: "Internal", value: "internal" },
          { title: "Client Visible", value: "client" },
        ],
        layout: "radio",
      },
      initialValue: "internal",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "pinnedMessageKeys",
      title: "Pinned Message Keys",
      type: "array",
      group: "messages",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "participants",
      type: "array",
      title: "Participants",
      group: "participants",
      of: [{ type: "reference", to: [{ type: "account" }] }],
      validation: (Rule) => Rule.required().min(2),
    }),
    defineField({
      name: "readStates",
      title: "Read States",
      type: "array",
      group: "participants",
      of: [
        {
          type: "object",
          name: "threadReadState",
          fields: [
            defineField({
              name: "user",
              title: "User",
              type: "reference",
              to: [{ type: "account" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "lastReadAt",
              title: "Last Read At",
              type: "datetime",
              validation: (Rule) => Rule.required(),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "messages",
      title: "Messages",
      type: "array",
      group: "messages",
      of: [
        {
          type: "object",
          name: "threadMessage",
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
                  { title: "Internal", value: "internal" },
                  { title: "Client Visible", value: "client" },
                ],
                layout: "radio",
              },
              initialValue: "internal",
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
              name: "reactions",
              title: "Reactions",
              type: "array",
              of: [
                {
                  type: "object",
                  name: "threadMessageReaction",
                  fields: [
                    defineField({
                      name: "emoji",
                      title: "Emoji",
                      type: "string",
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: "user",
                      title: "User",
                      type: "reference",
                      to: [{ type: "account" }],
                      validation: (Rule) => Rule.required(),
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
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      readOnly: true,
      group: "meta",
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      readOnly: true,
      group: "meta",
    }),
  ],
});
