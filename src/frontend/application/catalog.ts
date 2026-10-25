import type { Product } from "@/domain/models";

export const CATALOG_PAGE_SIZE = 12;
export const CATALOG_OPENINGS = [
  "Mở lùa",
  "Mở quay",
  "Mở hất",
  "Xếp trượt",
  "Cố định",
  "Vách cố định",
] as const;

export type CatalogFilters = {
  category: string;
  query: string;
  opening: "all" | (typeof CATALOG_OPENINGS)[number];
  sort: "featured" | "name";
  page: number;
};
type CatalogParameters = Partial<
  Record<"category" | "q" | "opening" | "sort" | "page", string | null>
>;

export function readCatalogFilters(
  parameters: CatalogParameters,
  categoryIds: readonly string[],
): CatalogFilters {
  const page =
    parameters.page && /^\d+$/.test(parameters.page)
      ? Number(parameters.page)
      : 1;
  return {
    category:
      parameters.category && categoryIds.includes(parameters.category)
        ? parameters.category
        : "all",
    query: (parameters.q || "").slice(0, 100),
    opening: CATALOG_OPENINGS.some((value) => value === parameters.opening)
      ? (parameters.opening as CatalogFilters["opening"])
      : "all",
    sort: parameters.sort === "name" ? "name" : "featured",
    page: Number.isSafeInteger(page) && page > 0 ? page : 1,
  };
}

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();

export function selectCatalogPage(
  products: readonly Product[],
  filters: CatalogFilters,
) {
  const query = normalize(filters.query);
  const filtered = products
    .filter(
      (product) =>
        product.status === "published" &&
        (filters.category === "all" || product.category === filters.category) &&
        (filters.opening === "all" || product.opening === filters.opening) &&
        normalize(
          `${product.name} ${product.code} ${product.summary}`,
        ).includes(query),
    )
    .sort((a, b) => {
      const order =
        filters.sort === "name"
          ? a.name.localeCompare(b.name, "vi", {
              numeric: true,
              sensitivity: "base",
            })
          : Number(b.featured) - Number(a.featured);
      return order || a.id.localeCompare(b.id, "en", { numeric: true });
    });
  const total = filtered.length;
  const totalPages = Math.ceil(total / CATALOG_PAGE_SIZE);
  const requestedPage =
    Number.isSafeInteger(filters.page) && filters.page > 0 ? filters.page : 1;
  const page = Math.min(requestedPage, totalPages || 1);
  const offset = (page - 1) * CATALOG_PAGE_SIZE;
  return {
    items: filtered.slice(offset, offset + CATALOG_PAGE_SIZE),
    page,
    total,
    totalPages,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + CATALOG_PAGE_SIZE, total),
  };
}

export function getPageItems(
  page: number,
  totalPages: number,
  compact = false,
): (number | "ellipsis")[] {
  if (totalPages <= 1) return totalPages ? [1] : [];
  const threshold = compact ? 5 : 7;
  if (totalPages <= threshold)
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  const current = Math.min(Math.max(page, 1), totalPages);
  const pages = new Set([1, totalPages, current]);
  if (!compact) {
    for (let value = current - 1; value <= current + 1; value++) {
      if (value > 1 && value < totalPages) pages.add(value);
    }
    if (current <= 4) for (let value = 2; value <= 5; value++) pages.add(value);
    if (current >= totalPages - 3)
      for (let value = totalPages - 4; value < totalPages; value++)
        pages.add(value);
  }
  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const value of [...pages].sort((a, b) => a - b)) {
    if (previous && value - previous === 2) result.push(previous + 1);
    else if (previous && value - previous > 2) result.push("ellipsis");
    result.push(value);
    previous = value;
  }
  return result;
}
