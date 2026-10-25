"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import Icon from "./Icon";
import { getPageItems } from "@/frontend/application/catalog";

type PaginationProps = {
  page: number;
  totalPages: number;
  controls: string;
  hrefForPage: (page: number) => string;
  onPageChange: (page: number) => void;
};

export default function Pagination({
  page,
  totalPages,
  controls,
  hrefForPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  function pageLink(
    target: number,
    label: string,
    content: ReactNode,
    className: string,
  ) {
    return (
      <Link
        href={hrefForPage(target)}
        scroll={false}
        prefetch={false}
        className={className}
        aria-label={label}
        aria-controls={controls}
        aria-current={target === page ? "page" : undefined}
        onNavigate={(event) => {
          event.preventDefault();
          onPageChange(target);
        }}
      >
        {content}
      </Link>
    );
  }
  function numbers(compact: boolean) {
    return (
      <span
        className={`catalog-pagination-pages${compact ? " catalog-pagination-pages-compact" : ""}`}
      >
        {getPageItems(page, totalPages, compact).map((value, index) =>
          value === "ellipsis" ? (
            <span
              className="catalog-pagination-gap"
              aria-hidden="true"
              key={`gap-${index}`}
            >
              …
            </span>
          ) : (
            <span key={value}>
              {pageLink(
                value,
                `Trang ${value}`,
                value,
                "catalog-pagination-page",
              )}
            </span>
          ),
        )}
      </span>
    );
  }
  const previous = (
    <>
      <Icon name="chevron" size={15} />
      <span className="catalog-pagination-control-label">Trước</span>
    </>
  );
  const next = (
    <>
      <span className="catalog-pagination-control-label">Sau</span>
      <Icon name="chevron" size={15} />
    </>
  );
  return (
    <nav className="catalog-pagination-nav" aria-label="Phân trang sản phẩm">
      {page === 1 ? (
        <span
          className="catalog-pagination-control catalog-pagination-previous"
          aria-label="Trang trước"
          aria-disabled="true"
        >
          {previous}
        </span>
      ) : (
        pageLink(
          page - 1,
          "Trang trước",
          previous,
          "catalog-pagination-control catalog-pagination-previous",
        )
      )}
      {numbers(false)}
      {numbers(true)}
      {page === totalPages ? (
        <span
          className="catalog-pagination-control"
          aria-label="Trang sau"
          aria-disabled="true"
        >
          {next}
        </span>
      ) : (
        pageLink(page + 1, "Trang sau", next, "catalog-pagination-control")
      )}
    </nav>
  );
}
