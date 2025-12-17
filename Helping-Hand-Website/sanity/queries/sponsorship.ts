import { groq } from "next-sanity";

export const SPONSORSHIPS_BY_EMAIL_QUERY = groq`
  *[_type == "sponsorship" && contactEmail == $email] | order(_createdAt desc) {
    _id,
    businessName,
    businessLogo{
      asset->{url}
    },
    contactEmail,
    mealsCount,
    date,
    location,
    notes,
    status
  }
`;
