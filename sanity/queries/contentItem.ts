import { groq } from "next-sanity";

export const CONTENT_ITEMS_QUERY = groq`*[_type == "contentItem"] | order(scheduledAt desc) {
  _id,
  title,
  platform,
  postType,
  caption,
  media,
  status,
  scheduledAt,
  client->{_id, businessName, name},
  internalNotes,
  _createdAt,
  _updatedAt
}`;
