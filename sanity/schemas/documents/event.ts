import { defineField, defineType } from "sanity";
import { CalendarDays } from "lucide-react";

export default defineType({
  name: "event",
  type: "document",
  title: "Event",
  icon: CalendarDays,
  fields: [
    defineField({
      name: "title",
      type: "string",
      title: "Title",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      type: "slug",
      title: "Slug",
      options: {
        source: "title",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      type: "text",
      title: "Description",
    }),
    defineField({
      name: "date",
      type: "datetime",
      title: "Date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      type: "string",
      title: "Location",
    }),
    defineField({
      name: "capacity",
      type: "number",
      title: "Capacity",
    }),
    defineField({
      name: "category",
      type: "string",
      title: "Category",
      options: {
        list: [
          { title: "Workshop", value: "workshop" },
          { title: "Webinar", value: "webinar" },
          { title: "Meetup", value: "meetup" },
          { title: "Conference", value: "conference" },
          { title: "Other", value: "other" },
        ],
      },
    }),
    defineField({
      name: "image",
      type: "image",
      title: "Image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "status",
      type: "string",
      title: "Status",
      options: {
        list: [
          { title: "Draft", value: "draft" },
          { title: "Pending", value: "pending" },
          { title: "Approved", value: "approved" },
          { title: "Rejected", value: "rejected" },
          { title: "Cancelled", value: "cancelled" },
          { title: "Completed", value: "completed" },
        ],
        layout: "radio",
      },
      initialValue: "draft",
    }),
    defineField({
      name: "client",
      type: "reference",
      title: "Client",
      to: [{ type: "account" }],
      validation: (Rule) => Rule.required(),
    }),
  ],
});
