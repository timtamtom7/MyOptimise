import { groq } from "next-sanity";

export const LEADS_QUERY = groq`
  *[_type == "lead"] | order(_updatedAt desc) {
    _id,
    companyName,
    contactName,
    email,
    status,
    value,
    notes,
    assignedTo->{
      _id,
      name,
      avatar
    },
    transcriptions,
    _createdAt,
    _updatedAt
  }
`;
