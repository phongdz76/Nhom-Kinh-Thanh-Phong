"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
import ProductCard from "@/frontend/presentation/website/ProductCard";
import { EmptyState } from "@/frontend/presentation/shared/Shared";
const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
export default function Catalog() {
  const params = useSearchParams();
  const { publishedProducts: products, publicCategories: categories } =
    useSite();
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [opening, setOpening] = useState("all");
  const [sort, setSort] = useState("featured");
  const requestedCategory = params.get("category");
  const urlCategory = categories.some((item) => item.id === requestedCategory)
    ? requestedCategory || "all"
    : "all";
  useEffect(() => {
    setCategory(urlCategory);
    setQuery(params.get("q") || "");
    if (
      params.get("focus") === "search" ||
      (typeof window !== "undefined" &&
        window.location.hash === "#catalog-search")
    ) {
      const timer = setTimeout(() => {
        const input = document.getElementById(
          "catalog-search-input",
        ) as HTMLInputElement | null;
        if (input) {
          input.scrollIntoView({ behavior: "smooth", block: "center" });
          input.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [params, urlCategory]);
  function changeCategory(value: string) {
    setCategory(value);
    const url = new URL(window.location.href);
    if (value === "all") url.searchParams.delete("category");
    else url.searchParams.set("category", value);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }
  function clearQuery() {
    setQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
    const input = document.getElementById(
      "catalog-search-input",
    ) as HTMLInputElement | null;
    input?.focus();
  }
  const published = products.filter((item) => item.status === "published");
  const filtered = published
    .filter(
      (item) =>
        (category === "all" || item.category === category) &&
        normalize(`${item.name} ${item.code} ${item.summary}`).includes(
          normalize(query),
        ) &&
        (opening === "all" || item.opening === opening),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name, "vi")
        : Number(b.featured) - Number(a.featured),
    );
  return (
    <div className="container catalog-layout">
      <aside className="catalog-sidebar">
        <h2>Danh mục sản phẩm</h2>
        <div className="catalog-categories">
          {categories.map((item) => (
            <button
              key={item.id}
              className={category === item.id ? "active" : ""}
              onClick={() => changeCategory(item.id)}
              aria-pressed={category === item.id}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.name}</span>
              <small>
                {item.id === "all"
                  ? published.length
                  : published.filter((product) => product.category === item.id)
                      .length}
              </small>
            </button>
          ))}
        </div>
        <div className="sidebar-help">
          <Icon name="message" size={28} />
          <h3>Chưa tìm được mẫu phù hợp?</h3>
          <p>Mỗi công trình có thể cần một phương án riêng.</p>
          <Link href="/quotation" className="text-link">
            Trao đổi nhu cầu <Icon name="arrow" size={16} />
          </Link>
        </div>
      </aside>
      <section className="catalog-main" aria-label="Danh sách sản phẩm">
        <div id="catalog-search" className="catalog-toolbar">
          <div className="search-field">
            <Icon name="search" size={18} />
            <input
              id="catalog-search-input"
              aria-label="Tìm kiếm sản phẩm"
              placeholder="Tìm theo tên, mã sản phẩm..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className="search-field-clear"
                aria-label="Xóa từ khóa tìm kiếm"
                onClick={clearQuery}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>
          <label className="opening-filter">
            <Icon name="filter" size={17} />
            <select
              aria-label="Lọc kiểu mở"
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
            >
              <option value="all">Tất cả kiểu mở</option>
              <option>Mở lùa</option>
              <option>Mở quay</option>
              <option>Cố định</option>
              <option>Vách cố định</option>
            </select>
          </label>
        </div>
        <div className="catalog-result">
          <p>
            <strong>{filtered.length}</strong> mẫu sản phẩm{" "}
            <span>· Hình ảnh tham khảo</span>
          </p>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="featured">Nổi bật trước</option>
            <option value="name">Tên A–Z</option>
          </select>
        </div>
        <div className="product-grid catalog-grid">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 && (
          <EmptyState
            title="Chưa tìm thấy mẫu phù hợp"
            text="Thử một từ khóa hoặc nhóm sản phẩm khác."
          >
            <button
              className="button button-outline"
              onClick={() => {
                setCategory("all");
                setQuery("");
                setOpening("all");
                const url = new URL(window.location.href);
                url.searchParams.delete("category");
                url.searchParams.delete("q");
                window.history.replaceState(null, "", url);
              }}
            >
              Xóa bộ lọc
            </button>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
