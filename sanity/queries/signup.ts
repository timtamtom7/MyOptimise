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
    proofMedia[]{
      _type,
      asset->{url}
    },
    event->{
      _id,
      "title": coalesce(title_i18n[$i18nKey], title),
      slug,
      date,
      "location": coalesce(location_i18n[$i18nKey], location),
      organization->{
        "name": coalesce(name_i18n[$i18nKey], name)
      }
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
    proofMedia[]{
      _type,
      asset->{url}
    },
    event->{
      _id,
      "title": coalesce(title_i18n[$i18nKey], title),
      slug,
      date,
      "location": coalesce(location_i18n[$i18nKey], location),
      organization->{
        "name": coalesce(name_i18n[$i18nKey], name)
      }
    }
  }
`;
