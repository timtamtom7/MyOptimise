import { sanityFetch } from "@/sanity/lib/live";
import { PAGE_QUERY, PAGES_SLUGS_QUERY } from "@/sanity/queries/page";
import { NAVIGATION_QUERY } from "@/sanity/queries/navigation";
import { SETTINGS_QUERY } from "@/sanity/queries/settings";
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
import { ACCOUNT_BY_EMAIL_QUERY, ACCOUNT_BY_ID_QUERY } from "../queries/account";
import { CONTENT_ITEMS_QUERY } from "@/sanity/queries/contentItem";
import { LEADS_QUERY } from "@/sanity/queries/lead";
import { ANALYTICS_QUERY } from "@/sanity/queries/analytics";

export const fetchLeads = async () => {
  const { data } = await sanityFetch({
    query: LEADS_QUERY,
    tags: ["lead"],
  });
  return data || [];
};

export const fetchAnalytics = async () => {
  const { data } = await sanityFetch({
    query: ANALYTICS_QUERY,
    tags: ["analyticsRecord"],
  });
  return data || [];
};

export const fetchContentItems = async () => {
  const { data } = await sanityFetch({
    query: CONTENT_ITEMS_QUERY,
    tags: ["contentItem"],
  });
  return data || [];
};

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

export const fetchSanityAccountById = async ({ id }: { id: string }): Promise<any> => {
  const { data } = await sanityFetch({
    query: ACCOUNT_BY_ID_QUERY,
    params: { id },
    perspective: "published",
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

    return (data ?? []) as PAGES_SLUGS_QUERYResult;
  };

export const fetchSanityPosts = async (): Promise<POSTS_QUERYResult> => {
  const { data } = await sanityFetch({
    query: POSTS_QUERY,
  });

  return (data ?? []) as POSTS_QUERYResult;
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

    return (data ?? []) as POSTS_SLUGS_QUERYResult;
  };

export const fetchSanityNavigation =
  async (): Promise<NAVIGATION_QUERYResult> => {
    const { data } = await sanityFetch({
      query: NAVIGATION_QUERY,
    });

    return (data ?? []) as NAVIGATION_QUERYResult;
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

export const fetchSanityAccountByEmail = async ({ email }: { email: string }): Promise<any> => {
  const normalizedEmail = String(email || "").trim();
  const { data } = await sanityFetch({
    query: ACCOUNT_BY_EMAIL_QUERY,
    params: { email: normalizedEmail },
    perspective: "published",
  });
  return data;
};
