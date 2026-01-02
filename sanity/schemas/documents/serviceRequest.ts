import { defineField, defineType } from "sanity";
import { ClipboardList } from "lucide-react";

export default defineType({
  name: "serviceRequest",
  type: "document",
  title: "Service Request",
  icon: ClipboardList,
  groups: [
    { name: "meta", title: "Meta" },
    { name: "details", title: "Details" },
    { name: "resolution", title: "Resolution" },
  ],
  fields: [
    defineField({
      name: "clientAccount",
      type: "reference",
      title: "Client Account",
      group: "meta",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "requestedServiceType",
      type: "string",
      title: "Requested Service Type",
      group: "details",
      options: {
        list: [
          { title: "Instagram", value: "instagram" },
          { title: "Facebook", value: "facebook" },
          { title: "Email", value: "email" },
          { title: "Website", value: "website" },
          { title: "Ads", value: "ads" },
          { title: "SEO", value: "seo" },
          { title: "Other", value: "other" },
        ],
        layout: "radio",
      },
      initialValue: "other",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "details",
      type: "text",
      title: "Details",
      group: "details",
    }),
    defineField({
      name: "attachments",
      title: "Attachments",
      type: "array",
      group: "details",
      of: [{ type: "file" }],
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      group: "meta",
      options: {
        list: [
          { title: "Submitted", value: "submitted" },
          { title: "In Review", value: "in_review" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
        ],
        layout: "radio",
      },
      initialValue: "submitted",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "resolutionNote",
      type: "text",
      title: "Resolution Note",
      group: "resolution",
    }),
    defineField({
      name: "resolvedBy",
      type: "reference",
      title: "Resolved By",
      group: "resolution",
      to: [{ type: "account" }],
      readOnly: true,
    }),
    defineField({
      name: "resolvedAt",
      title: "Resolved At",
      type: "datetime",
      group: "resolution",
      readOnly: true,
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

