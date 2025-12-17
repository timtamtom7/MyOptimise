import { groq } from "next-sanity";

export const EVENTS_QUERY = groq`
  *[_type == "event" && status == "approved" && date >= now()] | order(date asc) {
    _id,
    title,
    slug,
    date,
    location,
    capacity,
    category,
    image{
      asset->{url}
    },
    organization->{
      _id,
      name,
      slug
    }
  }
`;

export const EVENT_QUERY = groq`
  *[_type == "event" && slug.current == $slug][0]{
    _id,
    title,
    slug,
    description,
    date,
    location,
    capacity,
    category,
    status,
    image{
      asset->{url}
    },
    organization->{
      _id,
      name,
      slug,
      description,
      website,
      contactEmail
    }
  }
`;

export const EVENTS_SLUGS_QUERY = groq`*[_type == "event" && defined(slug)]{slug}`;
