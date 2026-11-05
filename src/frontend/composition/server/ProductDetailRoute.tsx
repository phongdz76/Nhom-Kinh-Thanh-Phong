import "server-only";
import { notFound } from "next/navigation";
import ProductDetail from "@/frontend/presentation/website/ProductDetail";
import { findPublicProduct } from "@/backend/composition/services";
import { canonicalOrigin, JsonLd, metadataForPage } from "./SeoRoutes";
import { breadcrumbSchema } from "@/frontend/infrastructure/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await findPublicProduct(id);
  if (!product) notFound();
  return metadataForPage(
    `/products/${encodeURIComponent(id)}`,
    product.name,
    product.summary,
    product.image,
  );
}
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await findPublicProduct(id);
  if (!product) notFound();
  const origin = canonicalOrigin();
  return (
    <>
      {origin && (
        <JsonLd
          data={breadcrumbSchema(origin, [
            { name: "Sản phẩm", path: "/products" },
            { name: product.name, path: `/products/${encodeURIComponent(id)}` },
          ])}
        />
      )}
      <ProductDetail id={id} />
    </>
  );
}
