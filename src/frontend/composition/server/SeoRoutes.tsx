import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { publicSite } from "@/backend/composition/services";
import {
  businessSchema,
  pageMetadata,
  publicPages,
  serializeSchema,
  websiteOrigin,
  websiteRobots,
  websiteSitemap,
} from "@/frontend/infrastructure/seo/metadata";

export const websiteData = cache(publicSite);
export const seoEnvironment = () => ({
  NODE_ENV: process.env.NODE_ENV,
  SERVER_URL: process.env.SERVER_URL,
  CONTEXT: process.env.SITE_DEPLOY_CONTEXT || process.env.CONTEXT,
  SITE_INDEXING_ENABLED: process.env.SITE_INDEXING_ENABLED,
});
export const metadataForPage = (
  path: string,
  title: string,
  description?: string,
  image?: string,
  article = false,
) => pageMetadata(seoEnvironment(), path, title, description, image, article);

function staticMetadata(path: string) {
  const page = publicPages.find((page) => page[0] === path)!;
  return metadataForPage(page[0], page[1], page[2]);
}
export const homeMetadata = () => ({
  ...staticMetadata("/"),
  title: { absolute: "Nhôm kính Thanh Phong" },
});
export const aboutMetadata = () => staticMetadata("/about");
export const productsMetadata = () => staticMetadata("/products");
export const projectsMetadata = () => staticMetadata("/projects");
export const newsMetadata = () => staticMetadata("/news");
export const contactMetadata = () => staticMetadata("/contact");
export const quotationMetadata = () => staticMetadata("/quotation");
export const privacyMetadata = () => staticMetadata("/policies/privacy");
export const robots = () => websiteRobots(seoEnvironment());
export async function sitemap() {
  // Local/preview sitemap must not query a production database or expose its URLs.
  if (!websiteRobots(seoEnvironment()).sitemap) return [];
  return websiteSitemap(seoEnvironment(), await websiteData());
}
export async function JsonLd({ data }: { data: unknown }) {
  if (!data) return null;
  const nonce = (await headers()).get("x-nonce") || undefined;
  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeSchema(data) }}
    />
  );
}
export const organizationSchema = (
  settings: Parameters<typeof businessSchema>[1],
) => businessSchema(process.env, settings);
export const canonicalOrigin = () => websiteOrigin(process.env);
