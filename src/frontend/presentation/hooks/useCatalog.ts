"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Category, Product } from "@/domain/models";
import {
  readCatalogFilters,
  selectCatalogPage,
} from "@/frontend/application/catalog";
import type { CatalogFilters } from "@/frontend/application/catalog";

function readParameters(parameters: URLSearchParams) {
  return Object.fromEntries(
    ["category", "q", "opening", "sort", "page"].map((key) => [
      key,
      parameters.get(key),
    ]),
  );
}

function writeParameters(parameters: URLSearchParams, filters: CatalogFilters) {
  const values = {
    category: filters.category === "all" ? "" : filters.category,
    q: filters.query,
    opening: filters.opening === "all" ? "" : filters.opening,
    sort: filters.sort === "featured" ? "" : filters.sort,
    page: filters.page === 1 ? "" : String(filters.page),
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) parameters.set(key, value);
    else parameters.delete(key);
  }
  return parameters.toString();
}

export function useCatalog(
  products: readonly Product[],
  categories: readonly Category[],
) {
  const parameters = useSearchParams();
  const pathname = usePathname();
  const search = parameters.toString();
  const categoryIds = categories
    .filter((category) => category.isActive)
    .map((category) => category.id);
  const filters = readCatalogFilters(
    readParameters(new URLSearchParams(search)),
    categoryIds,
  );
  const result = selectCatalogPage(products, filters);
  const canonicalSearch = writeParameters(new URLSearchParams(search), {
    ...filters,
    page: result.page,
  });
  const resultsRef = useRef<HTMLDivElement>(null);
  const pendingPageScroll = useRef(false);
  const focusSearch = parameters.get("focus") === "search";

  useEffect(() => {
    const url = new URL(window.location.href);
    // Ignore an obsolete render if another input has already changed the URL.
    if (url.searchParams.toString() !== search || search === canonicalSearch)
      return;
    window.history.replaceState(
      null,
      "",
      `${pathname}${canonicalSearch ? `?${canonicalSearch}` : ""}${url.hash}`,
    );
  }, [search, canonicalSearch, pathname]);

  useEffect(() => {
    if (!focusSearch && window.location.hash !== "#catalog-search") return;
    const timer = window.setTimeout(() => {
      const input = document.getElementById("catalog-search-input");
      input?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      input?.focus({ preventScroll: true });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [focusSearch]);

  useLayoutEffect(() => {
    if (!pendingPageScroll.current) return;
    pendingPageScroll.current = false;
    resultsRef.current?.focus({ preventScroll: true });
    resultsRef.current?.scrollIntoView({
      block: "start",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, [result.page, search]);

  function updateFilters(
    changes: Partial<CatalogFilters>,
    mode: "push" | "replace" = "push",
  ) {
    const url = new URL(window.location.href);
    const current = readCatalogFilters(
      readParameters(url.searchParams),
      categoryIds,
    );
    const next = { ...current, ...changes };
    next.page = selectCatalogPage(products, next).page;
    url.searchParams.delete("focus");
    if (url.hash === "#catalog-search") url.hash = "";
    const nextSearch = writeParameters(url.searchParams, next);
    const href = `${pathname}${nextSearch ? `?${nextSearch}` : ""}${url.hash}`;
    if (
      href ===
      `${window.location.pathname}${window.location.search}${window.location.hash}`
    )
      return;
    if (mode === "push") window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
  }

  function changePage(page: number) {
    if (page === result.page) return;
    pendingPageScroll.current = true;
    updateFilters({ page });
  }

  return {
    filters,
    result,
    resultsRef,
    changePage,
    hrefForPage: (page: number) => {
      const next = new URLSearchParams(search);
      next.delete("focus");
      const query = writeParameters(next, { ...filters, page });
      return `${pathname}${query ? `?${query}` : ""}`;
    },
    changeCategory: (category: string) => updateFilters({ category, page: 1 }),
    changeQuery: (query: string) =>
      updateFilters({ query: query.slice(0, 100), page: 1 }, "replace"),
    changeOpening: (opening: CatalogFilters["opening"]) =>
      updateFilters({ opening, page: 1 }),
    changeSort: (sort: CatalogFilters["sort"]) =>
      updateFilters({ sort, page: 1 }),
    clearQuery: () => {
      updateFilters({ query: "", page: 1 }, "replace");
      document
        .getElementById("catalog-search-input")
        ?.focus({ preventScroll: true });
    },
    clearFilters: () =>
      updateFilters({
        category: "all",
        query: "",
        opening: "all",
        sort: "featured",
        page: 1,
      }),
  };
}
