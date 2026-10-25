import type { Product } from "@/domain/models";

export function catalogProducts(count: number, prefix = "PAGE"): Product[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    const code = `${prefix}-${String(number).padStart(3, "0")}`;
    return {
      id: code,
      code,
      name: `Cửa nhôm mẫu ${String(number).padStart(3, "0")}`,
      category: number <= Math.ceil(count * 0.75) ? "doors" : "windows",
      summary: `${prefix} ${number <= 25 ? "đón sáng" : "tiêu chuẩn"}`,
      subtitle: "Mẫu dùng trong kiểm thử phân trang",
      opening: number % 3 === 0 ? "Mở quay" : "Mở lùa",
      color: "Xám ghi",
      tag: "Kiểm thử",
      image: "/images/hero-house.jpg",
      images: ["/images/hero-house.jpg"],
      status: "published",
      featured: number === count,
    };
  });
}
