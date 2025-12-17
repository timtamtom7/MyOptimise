import { groq } from "next-sanity";

export const ORGANIZATIONS_QUERY = groq`
  *[_type == "organization"] | order(name asc) {
    _id,
    name,
    slug,
    description,
    website,
    logo{
      asset->{url}
    }
  }
`;

export const ORGANIZATION_QUERY = groq`
  *[_type == "organization" && slug.current == $slug][0]{
    _id,
    name,
    slug,
    description,
    website,
    contactEmail,
    logo{
      asset->{url}
    },
    "events": *[_type == "event" && references(^._id) && status == "approved" && date >= now()] | order(date asc){
      _id, title, slug, date, location, capacity, category
    }
  }
`;
