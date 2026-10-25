import "server-only";
import { publicSite } from "@/backend/composition/services";
import NewsPage from "@/frontend/presentation/website/pages/NewsPage";
export { metadata } from "@/frontend/presentation/website/pages/NewsPage";
export default async function NewsRoute() {
  const { articles } = await publicSite();
  return <NewsPage articles={articles} />;
}
