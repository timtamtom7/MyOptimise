import Blocks from "@/components/blocks";
import {
  fetchSanityPageBySlug,
  fetchSanityPagesStaticParams,
} from "@/sanity/lib/fetch";
import { notFound } from "next/navigation";
import { generatePageMetadata } from "@/sanity/lib/metadata";
import { getLocale } from "@/lib/i18n-server";

export async function generateStaticParams() {
  try {
    const pages = await fetchSanityPagesStaticParams();
    return pages.map((page) => ({
      slug: page.slug?.current,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const locale = await getLocale();
  const page = await fetchSanityPageBySlug({ slug: params.slug, locale });

  if (!page) {
    notFound();
  }

  return generatePageMetadata({ page, slug: params.slug });
}

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const locale = await getLocale();
  const page = await fetchSanityPageBySlug({ slug: params.slug, locale });

  if (!page) {
    notFound();
  }

  return <Blocks blocks={page?.blocks ?? []} />;
}
