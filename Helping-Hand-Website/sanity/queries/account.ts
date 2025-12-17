import { groq } from "next-sanity";

export const ACCOUNT_BY_EMAIL_QUERY = groq`
  *[_type == "account" && email == $email][0]{
    _id, email, name, type, status, passwordHash
  }
`;

export const PENDING_ACCOUNTS_QUERY = groq`
  *[_type == "account" && status == "pending"] | order(_createdAt asc){
    _id, email, name, type
  }
`;
