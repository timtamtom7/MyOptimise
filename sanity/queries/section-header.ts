import { groq } from "next-sanity";
import { linkQuery } from "./shared/link";

// @sanity-typegen-ignore
export const sectionHeaderQuery = groq`
  _type == "section-header" => {
    _type,
    _key,
    padding,
    colorVariant,
    sectionWidth,
    stackAlign,
    "tagLine": coalesce(tagLine_i18n[$i18nKey], tagLine),
    "title": coalesce(title_i18n[$i18nKey], title),
    "description": coalesce(description_i18n[$i18nKey], description),
    link{
      ${linkQuery}
    },
  }
`;
