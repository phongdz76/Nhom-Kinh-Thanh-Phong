import "server-only";
import { notFound } from "next/navigation";
import { findPublicContent } from "@/backend/composition/services";
import ArticlePage from "@/frontend/presentation/website/pages/ArticlePage";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title: (await findPublicContent("posts", slug))?.title || "Cẩm nang",
  };
}
export default async function ArticleRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await findPublicContent("posts", slug);
  if (!article) notFound();
  return <ArticlePage article={article} />;
}
