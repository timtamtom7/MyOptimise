import { defineField, defineType } from "sanity";
import { Utensils } from "lucide-react";

export default defineType({
  name: "sponsorship",
  type: "document",
  title: "Sponsorship",
  icon: Utensils,
  fields: [
    defineField({ name: "businessName", type: "string", title: "Business Name", validation: (Rule) => Rule.required() }),
    defineField({ name: "businessLogo", type: "image", title: "Business Logo" }),
    defineField({ name: "contactEmail", type: "string", title: "Contact Email" }),
    defineField({ name: "mealsCount", type: "number", title: "Meals Count", validation: (Rule) => Rule.min(1) }),
    defineField({ name: "date", type: "datetime", title: "Date" }),
    defineField({ name: "location", type: "string", title: "Pickup/Delivery Location" }),
    defineField({ name: "notes", type: "text", title: "Notes" }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Submitted", value: "submitted" },
          { title: "Approved", value: "approved" },
          { title: "Completed", value: "completed" },
        ],
        layout: "radio",
      },
      initialValue: "submitted",
    }),
  ],
});
