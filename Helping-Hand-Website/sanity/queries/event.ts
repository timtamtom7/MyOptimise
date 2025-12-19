import { groq } from "next-sanity";

export const EVENTS_QUERY = groq`
  *[_type == "event" && status == "approved" && date >= now()] | order(date asc) {
    _id,
    "title": coalesce(title_i18n[$i18nKey], title),
    slug,
    date,
    "location": coalesce(location_i18n[$i18nKey], location),
    capacity,
    category,
    image{
      asset->{url}
    },
    organization->{
      _id,
      "name": coalesce(name_i18n[$i18nKey], name),
      slug
    }
  }
`;

export const EVENT_QUERY = groq`
  *[_type == "event" && slug.current == $slug][0]{
    _id,
    "title": coalesce(title_i18n[$i18nKey], title),
    slug,
    "description": coalesce(description_i18n[$i18nKey], description),
    date,
    "location": coalesce(location_i18n[$i18nKey], location),
    capacity,
    category,
    status,
    image{
      asset->{url}
    },
    organization->{
      _id,
      "name": coalesce(name_i18n[$i18nKey], name),
      slug,
      "description": coalesce(description_i18n[$i18nKey], description),
      website,
      contactEmail
    }
  }
`;

export const EVENTS_SLUGS_QUERY = groq`*[_type == "event" && defined(slug)]{slug}`;
