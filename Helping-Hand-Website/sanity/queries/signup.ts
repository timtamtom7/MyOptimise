import { groq } from "next-sanity";

export const SIGNUPS_BY_EMAIL_QUERY = groq`
  *[_type == "signup" && email == $email] | order(createdAt desc) {
    _id,
    name,
    email,
    phone,
    status,
    createdAt,
    completedAt,
    consent,
    proofImage{
      asset->{url}
    },
    event->{
      _id,
      title,
      slug,
      date,
      location,
      organization->{name}
    }
  }
`;

export const SIGNUP_BY_ID_QUERY = groq`
  *[_type == "signup" && _id == $id][0]{
    _id,
    name,
    email,
    status,
    consent,
    proofImage{
      asset->{url}
    },
    event->{
      _id,
      title,
      slug,
      date,
      location,
      organization->{name}
    }
  }
`;
