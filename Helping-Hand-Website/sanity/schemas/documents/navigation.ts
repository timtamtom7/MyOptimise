import { defineField, defineType } from "sanity";
import { Menu } from "lucide-react";

export default defineType({
  name: "navigation",
  title: "Navigation",
  type: "document",
  icon: Menu,
  fields: [
    defineField({
      name: "links",
      title: "Links",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "title", type: "string", title: "Title" },
            { name: "href", type: "url", title: "URL" },
            { name: "isExternal", type: "boolean", title: "Open in new tab", initialValue: false },
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare() {
      return { title: "Navigation" };
    },
  },
});
