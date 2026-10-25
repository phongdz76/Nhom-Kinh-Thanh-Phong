import "server-only";
import { notFound } from "next/navigation";
import ProductDetail from "@/frontend/presentation/website/ProductDetail";
import { findPublicProduct } from "@/backend/composition/services";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: (await findPublicProduct(id))?.name || "Chi tiết sản phẩm",
  };
}
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!(await findPublicProduct(id))) notFound();
  return <ProductDetail id={id} />;
}
