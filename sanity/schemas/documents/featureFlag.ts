import { defineField, defineType } from "sanity";
import { Flag } from "lucide-react";

export default defineType({
  name: "featureFlag",
  type: "document",
  title: "Feature Flag",
  icon: Flag,
  fields: [
    defineField({
      name: "key",
      type: "string",
      title: "Key",
      validation: (Rule) =>
        Rule.required()
          .min(2)
          .max(80)
          .regex(/^[a-z0-9][a-z0-9._-]*$/i, { name: "featureFlagKey" }),
    }),
    defineField({ name: "enabled", type: "boolean", title: "Enabled", initialValue: true }),
    defineField({ name: "description", type: "string", title: "Description" }),
  ],
  preview: {
    select: {
      title: "key",
      subtitle: "description",
    },
  },
});

