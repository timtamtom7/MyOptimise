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
      title: "Format",
      options: {
        list: [
          { title: "Reel", value: "reel" },
          { title: "Story", value: "story" },
          { title: "Carousel", value: "carousel" },
          { title: "Static Post", value: "static_post" },
          { title: "Video (Long form)", value: "video_long" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "platform",
      type: "string",
      title: "Platform",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "TikTok", value: "tiktok" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "YouTube", value: "youtube" },
          { title: "Facebook", value: "facebook" },
          { title: "Twitter/X", value: "twitter" },
          { title: "Other", value: "other" },
        ],
      },
      group: "details",
    }),
    defineField({
      name: "difficulty",
      type: "string",
      title: "Level of Difficulty",
      options: {
        list: [
          { title: "Low", value: "low" },
          { title: "Medium", value: "medium" },
          { title: "High", value: "high" },
        ],
      },
      group: "details",
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
      name: "hook",
      type: "text",
      title: "Hook / Angle",
      group: "content",
    }),
    defineField({
      name: "creativeGoal",
      type: "text",
      title: "Creative Goal",
      description: "What is the main objective of this piece?",
      group: "content",
    }),
    defineField({
      name: "contentConcept",
      type: "text",
      title: "Content Concept",
      description: "The core idea or concept",
      group: "content",
    }),
    defineField({
      name: "references",
      type: "array",
      title: "References / Examples",
      of: [{ type: "url" }],
      group: "content",
    }),
    defineField({
      name: "assets",
      type: "array",
      title: "Required Assets",
      of: [{ type: "file" }, { type: "image" }, { type: "url" }],
      group: "content",
    }),
    defineField({
      name: "claimedAt",
      type: "datetime",
      title: "Claimed At",
      group: "details",
    }),
    defineField({
      name: "script",
      type: "text",
      title: "Script / Outline",
      rows: 10,
      group: "content",
    }),
    defineField({
      name: "visualDirection",
      type: "text",
      title: "Visual Direction",
      rows: 5,
      group: "content",
    }),
    defineField({
      name: "price",
      type: "number",
      title: "Price (Pay-per-deliverable)",
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
            defineField({
              name: "comments",
              type: "array",
              title: "Comments",
              of: [
                {
                  type: "object",
                  fields: [
                    defineField({ name: "text", type: "string", title: "Comment" }),
                    defineField({ name: "timestamp", type: "number", title: "Timestamp (seconds)" }),
                    defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
                    defineField({ name: "author", type: "reference", to: [{ type: "account" }], title: "Author" }),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "approvalToken",
      type: "string",
      title: "Approval Token",
      group: "details",
      readOnly: true,
    }),
    defineField({
      name: "approvalTokenExpiry",
      type: "datetime",
      title: "Approval Token Expiry",
      group: "details",
      readOnly: true,
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
            defineField({ name: "clientName", type: "string", title: "Client Name" }),
            defineField({ name: "createdAt", type: "datetime", title: "Created At" }),
          ],
        },
      ],
    }),
    defineField({
      name: "statusHistory",
      type: "array",
      title: "Status History",
      of: [
        {
          type: "object",
          name: "deliverableStatusChange",
          fields: [
            defineField({
              name: "fromStatus",
              type: "string",
              title: "From",
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
            }),
            defineField({
              name: "toStatus",
              type: "string",
              title: "To",
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
            }),
            defineField({
              name: "changedBy",
              type: "reference",
              title: "Changed By",
              to: [{ type: "account" }],
            }),
            defineField({
              name: "changedAt",
              type: "datetime",
              title: "Changed At",
            }),
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
