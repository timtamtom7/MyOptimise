import { groq } from "next-sanity";

export const ACCOUNT_BY_EMAIL_QUERY = groq`
  *[_type == "account" && lower(email) == lower($email)][0]{
    _id,
    email,
    name,
    type,
    status,
    passwordHash,
    skills,
    portfolioTags,
    capabilities,
    revokedCapabilities,
    avatar,
    timezone,
    locale,
    notificationPreferences,
    sessionVersion,
    lastLoginAt,
    loginHistory,
    brandAssets[]{
      _key,
      title,
      type,
      "fileUrl": file.asset->url,
      url,
      tags,
      aiTags
    },
    businessName,
    onboardingStatus,
    serviceScope,
    stripeCustomerId,
    stripeSubscriptionId
  }
`;

export const ACCOUNT_BY_ID_QUERY = groq`
  *[_type == "account" && _id == $id][0]{
    _id,
    email,
    name,
    type,
    status,
    passwordHash,
    skills,
    portfolioTags,
    capabilities,
    revokedCapabilities,
    avatar,
    timezone,
    locale,
    notificationPreferences,
    sessionVersion,
    lastLoginAt,
    loginHistory,
    brandAssets[]{
      _key,
      title,
      type,
      "fileUrl": file.asset->url,
      url,
      tags,
      aiTags
    },
    businessName,
    onboardingStatus,
    serviceScope,
    stripeCustomerId,
    stripeSubscriptionId
  }
`;
