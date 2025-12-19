import { groq } from "next-sanity";

export const ORGANIZATIONS_QUERY = groq`
  *[_type == "organization"] | order(name asc) {
    _id,
    "name": coalesce(name_i18n[$i18nKey], name),
    slug,
    "description": coalesce(description_i18n[$i18nKey], description),
    website,
    logo{
      asset->{url}
    }
  }
`;

export const ORGANIZATION_QUERY = groq`
  *[_type == "organization" && slug.current == $slug][0]{
    _id,
    "name": coalesce(name_i18n[$i18nKey], name),
    slug,
    "description": coalesce(description_i18n[$i18nKey], description),
    website,
    contactEmail,
    logo{
      asset->{url}
    },
    "events": *[_type == "event" && references(^._id) && status == "approved" && date >= now()] | order(date asc){
      _id, "title": coalesce(title_i18n[$i18nKey], title), slug, date, "location": coalesce(location_i18n[$i18nKey], location), capacity, category
    }
  }
`;
