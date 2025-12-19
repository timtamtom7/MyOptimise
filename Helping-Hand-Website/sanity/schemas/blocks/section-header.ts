import { defineField, defineType } from "sanity";
import { LetterText } from "lucide-react";
import { STACK_ALIGN, SECTION_WIDTH } from "./shared/layout-variants";

export default defineType({
  name: "section-header",
  type: "object",
  title: "Section Header",
  description: "A section header with a tag line, title, and description",
  icon: LetterText,
  fields: [
    defineField({
      name: "padding",
      type: "section-padding",
    }),
    defineField({
      name: "colorVariant",
      type: "color-variant",
      title: "Color Variant",
      description: "Select a background color variant",
    }),
    defineField({
      name: "sectionWidth",
      type: "string",
      title: "Section Width",
      options: {
        list: SECTION_WIDTH.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "default",
    }),
    defineField({
      name: "stackAlign",
      type: "string",
      title: "Stack Layout Alignment",
      options: {
        list: STACK_ALIGN.map(({ title, value }) => ({ title, value })),
        layout: "radio",
      },
      initialValue: "left",
    }),
    defineField({
      name: "tagLine",
      type: "string",
    }),
    defineField({
      name: "tagLine_i18n",
      title: "Tag Line (Translations)",
      type: "object",
      fields: [
        { name: "en", type: "string", title: "English" },
        { name: "zh_hk", type: "string", title: "中文（粵語）" },
        { name: "zh_cn", type: "string", title: "中文（普通话）" },
      ],
    }),
    defineField({
      name: "title",
      type: "string",
    }),
    defineField({
      name: "title_i18n",
      title: "Title (Translations)",
      type: "object",
      fields: [
        { name: "en", type: "string", title: "English" },
        { name: "zh_hk", type: "string", title: "中文（粵語）" },
        { name: "zh_cn", type: "string", title: "中文（普通话）" },
      ],
    }),
    defineField({
      name: "description",
      type: "text",
    }),
    defineField({
      name: "description_i18n",
      title: "Description (Translations)",
      type: "object",
      fields: [
        { name: "en", type: "text", title: "English" },
        { name: "zh_hk", type: "text", title: "中文（粵語）" },
        { name: "zh_cn", type: "text", title: "中文（普通话）" },
      ],
    }),
  ],
  preview: {
    select: {
      title: "title",
    },
    prepare({ title }) {
      return {
        title: "Section Header",
        subtitle: title,
      };
    },
  },
});
