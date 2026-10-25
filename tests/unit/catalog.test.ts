import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CATALOG_PAGE_SIZE,
  getPageItems,
  readCatalogFilters,
  selectCatalogPage,
} from "@/frontend/application/catalog";
import { catalogProducts } from "../fixtures/catalog";

const filters = readCatalogFilters({}, ["doors", "windows"]);

test("catalog pages cover empty, exact and partial page boundaries", () => {
  for (const total of [0, 1, 12, 13, 25]) {
    const products = catalogProducts(total);
    const first = selectCatalogPage(products, filters);
    assert.equal(first.total, total);
    assert.equal(first.items.length, Math.min(total, CATALOG_PAGE_SIZE));
    assert.equal(first.start, total ? 1 : 0);
    assert.equal(first.end, Math.min(total, 12));
    assert.equal(first.totalPages, Math.ceil(total / 12));
    const last = selectCatalogPage(products, { ...filters, page: 999 });
    assert.equal(last.page, Math.max(1, Math.ceil(total / 12)));
    assert.equal(last.end, total);
  }
});

test("every matching product appears exactly once across pages without mutating input", () => {
  const products = catalogProducts(25).reverse();
  const original = products.map((product) => product.id);
  const ids = [1, 2, 3].flatMap((page) =>
    selectCatalogPage(products, { ...filters, page }).items.map(
      (product) => product.id,
    ),
  );
  assert.equal(ids.length, 25);
  assert.equal(new Set(ids).size, 25);
  assert.deepEqual([...ids].sort(), [...original].sort());
  assert.deepEqual(
    products.map((product) => product.id),
    original,
  );
  assert.equal(ids[0], "PAGE-025");
});

test("catalog filters and sorting run before pagination with Vietnamese search", () => {
  const products = catalogProducts(97);
  const result = selectCatalogPage(products, {
    ...filters,
    query: "PAGE don sang",
    sort: "name",
    page: 2,
  });
  assert.equal(result.total, 25);
  assert.equal(result.start, 13);
  assert.equal(result.end, 24);
  assert.equal(result.items[0].id, "PAGE-013");
  const combined = selectCatalogPage(products, {
    ...filters,
    category: "doors",
    opening: "Mở quay",
    query: "don sang",
  });
  assert.equal(combined.total, 8);
  products[0].status = "draft";
  assert.equal(selectCatalogPage(products, filters).total, 96);
  assert.equal(
    selectCatalogPage(products, { ...filters, query: "no-matching-product" })
      .start,
    0,
  );
});

test("URL filters reject malformed pages and unsupported choices", () => {
  for (const page of [
    "0",
    "-1",
    "abc",
    "1.5",
    "1e2",
    "Infinity",
    "9007199254740992",
  ])
    assert.equal(readCatalogFilters({ page }, []).page, 1);
  assert.equal(readCatalogFilters({ page: "02" }, []).page, 2);
  assert.deepEqual(
    readCatalogFilters(
      { category: "missing", opening: "missing", sort: "missing" },
      ["doors"],
    ),
    filters,
  );
  assert.equal(
    readCatalogFilters({ q: "a".repeat(200) }, []).query.length,
    100,
  );
});

test("stable sorting survives source reorder and decreasing result counts", () => {
  const products = catalogProducts(25);
  assert.deepEqual(
    selectCatalogPage(products, filters).items,
    selectCatalogPage([...products].reverse(), filters).items,
  );
  const smaller = selectCatalogPage(products.slice(0, 12), {
    ...filters,
    page: 3,
  });
  assert.equal(smaller.page, 1);
  assert.equal(smaller.totalPages, 1);
});

test("pagination keeps current page and boundaries with bounded desktop and mobile links", () => {
  for (const compact of [false, true]) {
    for (const total of [0, 1, 3, 5, 7, 9, 30]) {
      for (let page = 1; page <= total; page++) {
        const items = getPageItems(page, total, compact);
        const numbers = items.filter(
          (item): item is number => typeof item === "number",
        );
        assert.ok(
          numbers.includes(1) &&
            numbers.includes(total) &&
            numbers.includes(page),
        );
        assert.equal(new Set(numbers).size, numbers.length);
        assert.ok(items.length <= (compact ? 5 : 7));
      }
    }
  }
  assert.deepEqual(getPageItems(1, 0), []);
  assert.deepEqual(getPageItems(1, 1), [1]);
});
