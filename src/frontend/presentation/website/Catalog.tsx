"use client";
import Link from "next/link";
import { CATALOG_OPENINGS } from "@/frontend/application/catalog";
import type { CatalogFilters } from "@/frontend/application/catalog";
import { useCatalog } from "@/frontend/presentation/hooks/useCatalog";
import Pagination from "@/frontend/presentation/shared/Pagination";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
import ProductCard from "@/frontend/presentation/website/ProductCard";
import { EmptyState } from "@/frontend/presentation/shared/Shared";
export default function Catalog() {
  const { publishedProducts: products, publicCategories: categories } =
    useSite();
  const {
    filters: { category, query, opening, sort },
    result,
    resultsRef,
    changeCategory,
    changeQuery,
    changeOpening,
    changeSort,
    clearQuery,
    clearFilters,
    changePage,
    hrefForPage,
  } = useCatalog(products, categories);
  const published = products.filter((item) => item.status === "published");
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
              maxLength={100}
              onChange={(event) => changeQuery(event.target.value)}
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
              onChange={(event) =>
                changeOpening(event.target.value as CatalogFilters["opening"])
              }
            >
              <option value="all">Tất cả kiểu mở</option>
              {CATALOG_OPENINGS.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="catalog-result">
          <p>
            <strong>{result.total}</strong> mẫu sản phẩm{" "}
            <span>· Hình ảnh tham khảo</span>
          </p>
          <select
            value={sort}
            onChange={(event) =>
              changeSort(event.target.value as CatalogFilters["sort"])
            }
            aria-label="Sắp xếp sản phẩm"
          >
            <option value="featured">Nổi bật trước</option>
            <option value="name">Tên A–Z</option>
          </select>
        </div>
        <div
          className="product-grid catalog-grid"
          id="catalog-products"
          ref={resultsRef}
          tabIndex={-1}
          role="region"
          aria-label="Các mẫu sản phẩm"
        >
          {result.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="catalog-pagination">
          <p
            className="catalog-page-summary"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {result.total > 0 ? (
              <>
                Đang hiển thị{" "}
                <strong>
                  {result.start}–{result.end}
                </strong>{" "}
                trong tổng số <strong>{result.total}</strong> mẫu
              </>
            ) : (
              "Không có sản phẩm phù hợp"
            )}
          </p>
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            controls="catalog-products"
            hrefForPage={hrefForPage}
            onPageChange={changePage}
          />
        </div>
        {result.total === 0 && (
          <EmptyState
            title="Chưa tìm thấy mẫu phù hợp"
            text="Thử một từ khóa hoặc nhóm sản phẩm khác."
          >
            <button className="button button-outline" onClick={clearFilters}>
              Xóa bộ lọc
            </button>
          </EmptyState>
        )}
      </section>
    </div>
  );
}
