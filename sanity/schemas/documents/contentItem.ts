import { defineField, defineType } from "sanity";
import { Image, Smartphone, Instagram, Linkedin, Facebook, Video } from "lucide-react";

export default defineType({
  name: "contentItem",
  type: "document",
  title: "Content Item",
  icon: Smartphone,
  groups: [
    { name: "content", title: "Content" },
    { name: "scheduling", title: "Scheduling" },
    { name: "approval", title: "Approval" },
    { name: "meta", title: "Meta" },
  ],
  fields: [
    defineField({
      name: "title",
      title: "Internal Title",
      type: "string",
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      title: "Client",
      type: "reference",
      to: [{ type: "account" }], // filtering for type=client ideally
      group: "content",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "TikTok", value: "tiktok" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "Facebook", value: "facebook" },
          { title: "YouTube Shorts", value: "youtube_shorts" },
        ],
        layout: "radio",
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "postType",
      title: "Post Type",
      type: "string",
      group: "content",
      options: {
        list: [
          { title: "Feed Post", value: "post" },
          { title: "Reel / Short", value: "reel" },
          { title: "Story", value: "story" },
          { title: "Carousel", value: "carousel" },
        ],
        layout: "radio",
      },
      initialValue: "post",
    }),
    defineField({
      name: "caption",
      title: "Caption",
      type: "text",
      group: "content",
      rows: 4,
    }),
    defineField({
      name: "media",
      title: "Media Assets",
      type: "array",
      group: "content",
      of: [
        { type: "image", options: { hotspot: true } },
        { type: "file", title: "Video File", options: { accept: "video/*" } }
      ],
      validation: (Rule) => Rule.min(1).error("At least one media asset is required"),
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      group: "approval",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Internal Review", value: "internal_review" },
          { title: "Client Review", value: "client_review" },
          { title: "Changes Requested", value: "changes_requested" },
          { title: "Scheduled", value: "scheduled" },
          { title: "Published", value: "published" },
        ],
      },
      initialValue: "draft",
    }),
    defineField({
      name: "approvalToken",
      title: "Approval Token",
      type: "string",
      group: "approval",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "scheduledAt",
      title: "Scheduled Time",
      type: "datetime",
      group: "scheduling",
      hidden: ({ document }) => document?.status !== "scheduled" && document?.status !== "published",
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      group: "scheduling",
      readOnly: true,
    }),
    defineField({
      name: "internalNotes",
      title: "Internal Notes",
      type: "array",
      group: "approval",
      of: [{ type: "block" }],
      description: "Feedback and change requests.",
    }),
    defineField({
      name: "author",
      title: "Created By",
      type: "reference",
      to: [{ type: "account" }],
      group: "meta",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: "title",
      client: "client.name",
      media: "media.0.asset",
      status: "status",
    },
    prepare({ title, client, media, status }) {
      return {
        title: title,
        subtitle: `${client || "No Client"} | ${status}`,
        media: media || Smartphone,
      };
    },
  },
});
