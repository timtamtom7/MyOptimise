import { defineField, defineType } from "sanity";
import { Link2 } from "lucide-react";

export default defineType({
  name: "socialConnection",
  title: "Social Connection",
  type: "document",
  icon: Link2,
  fields: [
    defineField({
      name: "platform",
      title: "Platform",
      type: "string",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "TikTok", value: "tiktok" },
          { title: "Facebook", value: "facebook" },
          { title: "LinkedIn", value: "linkedin" },
          { title: "YouTube Shorts", value: "youtube_shorts" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "client",
      title: "Client Account",
      type: "reference",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "accessToken",
      title: "Access Token",
      type: "string",
      readOnly: true,
      hidden: true, // Hide from UI by default for security
    }),
    defineField({
      name: "refreshToken",
      title: "Refresh Token",
      type: "string",
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: "expiresAt",
      title: "Expires At",
      type: "datetime",
      readOnly: true,
    }),
    defineField({
      name: "pageId",
      title: "Page / Account ID",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "pageName",
      title: "Page Name",
      type: "string",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Disconnected", value: "disconnected" },
          { title: "Expired", value: "expired" },
        ],
      },
      initialValue: "active",
    }),
  ],
  preview: {
    select: {
      platform: "platform",
      client: "client.name",
      status: "status",
      pageName: "pageName",
    },
    prepare({ platform, client, status, pageName }) {
      return {
        title: `${platform} - ${client}`,
        subtitle: `${status} (${pageName || "No Page"})`,
      };
    },
  },
});
