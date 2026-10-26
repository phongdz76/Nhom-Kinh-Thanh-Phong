import { findPublicProduct, publicSite } from "@/backend/composition/services";
import { HttpError, endpoint, json } from "@/backend/interfaces/http/response";
import { formProtection } from "@/backend/composition/form-protection";

export const getSite = endpoint(async () => json(await publicSite()));
export const getFormProtection = endpoint(async () => json(formProtection()));

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
export const listProducts = endpoint(async (request) => {
  const query = new URL(request.url).searchParams;
  const page = Number(query.get("page") || 1);
  const limit = Number(query.get("limit") || 12);
  if (
    !Number.isInteger(page) ||
    page < 1 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 48
  )
    throw new HttpError(400, "Phân trang không hợp lệ.");
  const state = await publicSite();
  const q = normalize((query.get("q") || "").slice(0, 100));
  const products = state.products.filter(
    (item) =>
      (!query.get("category") || item.category === query.get("category")) &&
      (!query.get("opening") || item.opening === query.get("opening")) &&
      normalize(`${item.name} ${item.code} ${item.summary}`).includes(q),
  );
  return json({
    products: products.slice((page - 1) * limit, page * limit),
    total: products.length,
    page,
    limit,
    hasNextPage: page * limit < products.length,
  });
});

export const getProduct = endpoint(async (_request, context) => {
  const { id } = await context.params;
  const product = await findPublicProduct(id);
  if (!product) throw new HttpError(404, "Không tìm thấy sản phẩm.");
  return json({ product });
});
