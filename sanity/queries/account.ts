import { groq } from "next-sanity";

export const ACCOUNT_BY_EMAIL_QUERY = groq`
  *[_type == "account" && lower(email) == lower($email)][0]{
    _id,
    email,
    name,
    type,
    status,
    passwordHash,
    capabilities,
    revokedCapabilities,
    avatar,
    timezone,
    locale,
    notificationPreferences,
    sessionVersion,
    lastLoginAt,
    loginHistory
  }
`;
