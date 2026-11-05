import "server-only";
import { notFound } from "next/navigation";
import { findPublicContent } from "@/backend/composition/services";
import ArticlePage from "@/frontend/presentation/website/pages/ArticlePage";
import { canonicalOrigin, JsonLd, metadataForPage } from "./SeoRoutes";
import { breadcrumbSchema } from "@/frontend/infrastructure/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await findPublicContent("posts", slug);
  if (!article) notFound();
  return metadataForPage(
    `/news/${encodeURIComponent(slug)}`,
    article.title,
    article.intro,
    article.image,
    true,
  );
}
export default async function ArticleRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await findPublicContent("posts", slug);
  if (!article) notFound();
  const origin = canonicalOrigin();
  const path = `/news/${encodeURIComponent(slug)}`;
  return (
    <>
      {origin && (
        <JsonLd
          data={[
            breadcrumbSchema(origin, [
              { name: "Cẩm nang", path: "/news" },
              { name: article.title, path },
            ]),
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.intro,
              image: new URL(article.image, origin).href,
              mainEntityOfPage: new URL(path, origin).href,
              inLanguage: "vi",
              articleBody: article.sections
                .map((section) => `${section.title}\n${section.text}`)
                .join("\n\n"),
            },
          ]}
        />
      )}
      <ArticlePage article={article} />
    </>
  );
}
