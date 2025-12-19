import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { NAVIGATION_QUERY } from "@/sanity/queries/navigation";
import { SETTINGS_QUERY } from "@/sanity/queries/settings";
import {
  EVENTS_QUERY,
  EVENT_QUERY,
  EVENTS_SLUGS_QUERY,
} from "@/sanity/queries/event";
import {
  ORGANIZATIONS_QUERY,
  ORGANIZATION_QUERY,
} from "@/sanity/queries/organization";
import {
  POST_QUERY,
  POSTS_QUERY,
  POSTS_SLUGS_QUERY,
} from "@/sanity/queries/post";
import {
  PAGE_QUERYResult,
  PAGES_SLUGS_QUERYResult,
  POST_QUERYResult,
  POSTS_QUERYResult,
  POSTS_SLUGS_QUERYResult,
  NAVIGATION_QUERYResult,
  SETTINGS_QUERYResult,
} from "@/sanity.types";
import { SIGNUPS_BY_EMAIL_QUERY, SIGNUP_BY_ID_QUERY } from "@/sanity/queries/signup";
import { SPONSORSHIPS_BY_EMAIL_QUERY } from "../queries/sponsorship";
import { ACCOUNT_BY_EMAIL_QUERY, PENDING_ACCOUNTS_QUERY } from "../queries/account";
import { client } from "@/sanity/lib/client";

export const fetchSanityPageBySlug = async ({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}): Promise<PAGE_QUERYResult> => {
  const { data } = await sanityFetch({
    query: PAGE_QUERY,
    params: { slug, i18nKey: mapLocaleToI18nKey(locale) },
  });

  return data;
};

export const fetchSanityPagesStaticParams =
  async (): Promise<PAGES_SLUGS_QUERYResult> => {
    const { data } = await sanityFetch({
      query: PAGES_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });

    return data;
  };

export const fetchSanityPosts = async (): Promise<POSTS_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
  });

  return data;
};

export const fetchSanityPostBySlug = async ({
  slug,
}: {
  slug: string;
}): Promise<POST_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POST_QUERY,
    params: { slug },
  });

  return data;
};

export const fetchSanityPostsStaticParams =
  async (): Promise<POSTS_SLUGS_QUERYResult> => {
    const { data } = await sanityFetch({
      query: POSTS_SLUGS_QUERY,
      perspective: "published",
      stega: false,
    });

    return data;
  };

export const fetchSanityNavigation =
  async (): Promise<NAVIGATION_QUERYResult> => {
    const { data } = await sanityFetch({
      query: NAVIGATION_QUERY,
    });

    return data;
  };

export const fetchSanitySettings = async (): Promise<SETTINGS_QUERYResult> => {
  const { data } = await sanityFetch({
    query: SETTINGS_QUERY,
  });

  return data;
};

function mapLocaleToI18nKey(locale: string): string {
  switch (locale) {
    case "zh-HK":
      return "zh_hk";
    case "zh-CN":
      return "zh_cn";
    default:
      return "en";
  }
}

export const fetchSanityEvents = async ({ locale }: { locale: string }): Promise<any> => {
  const { data } = await sanityFetch({
    query: EVENTS_QUERY,
    params: { i18nKey: mapLocaleToI18nKey(locale) },
  });
  return data;
};

export const fetchSanityEventBySlug = async ({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}): Promise<any> => {
  const { data } = await sanityFetch({
    query: EVENT_QUERY,
    params: { slug, i18nKey: mapLocaleToI18nKey(locale) },
  });
  return data;
};

export const fetchSanityEventsStaticParams = async (): Promise<
  { slug?: { current?: string } }[]
> => {
  const { data } = await sanityFetch({
    query: EVENTS_SLUGS_QUERY,
    perspective: "published",
    stega: false,
  });
  return data;
};

export const fetchSanityOrganizations = async ({ locale }: { locale: string }): Promise<any> => {
  const { data } = await sanityFetch({
    query: ORGANIZATIONS_QUERY,
    params: { i18nKey: mapLocaleToI18nKey(locale) },
    perspective: "published",
  });
  return data;
};

export const fetchSanityOrganizationsStaticParams = async (): Promise<
  { slug?: { current?: string } }[]
> => {
  const data = await client.fetch(`*[_type == "organization" && defined(slug)]{slug}`);
  return data;
};

export const fetchSanityOrganizationBySlug = async ({
  slug,
  locale,
}: {
  slug: string;
  locale: string;
}): Promise<any> => {
  const { data } = await sanityFetch({
    query: ORGANIZATION_QUERY,
    params: { slug, i18nKey: mapLocaleToI18nKey(locale) },
    perspective: "published",
  });
  return data;
};

export const fetchSanitySignupById = async ({
  id,
  locale,
}: {
  id: string;
  locale: string;
}): Promise<any> => {
  const { data } = await sanityFetch({
    query: SIGNUP_BY_ID_QUERY,
    params: { id, i18nKey: mapLocaleToI18nKey(locale) },
  });
  return data;
};

export const fetchSanitySignupsByEmail = async ({
  email,
  locale,
}: {
  email: string;
  locale: string;
}): Promise<any[]> => {
  const { data } = await sanityFetch({
    query: SIGNUPS_BY_EMAIL_QUERY,
    params: { email, i18nKey: mapLocaleToI18nKey(locale) },
  });
  return data;
};

export const fetchSanitySponsorshipsByEmail = async ({
  email,
}: {
  email: string;
}): Promise<any[]> => {
  const { data } = await sanityFetch({
    query: SPONSORSHIPS_BY_EMAIL_QUERY,
    params: { email },
  });
  return data;
};

export const fetchSanityAccountByEmail = async ({ email }: { email: string }): Promise<any> => {
  const { data } = await sanityFetch({
    query: ACCOUNT_BY_EMAIL_QUERY,
    params: { email },
  });
  return data;
};

export const fetchSanityPendingAccounts = async (): Promise<any[]> => {
  const { data } = await sanityFetch({
    query: PENDING_ACCOUNTS_QUERY,
  });
  return data;
};
