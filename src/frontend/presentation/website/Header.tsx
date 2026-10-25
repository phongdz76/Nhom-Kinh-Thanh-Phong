"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import BrandLink, { HomeLink } from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
import { useMenuNavigation } from "@/frontend/presentation/hooks/useMenuNavigation";
const navigation = [
  ["/", "Trang chủ"],
  ["/about", "Giới thiệu"],
  ["/products", "Sản phẩm"],
  ["/projects", "Công trình"],
  ["/news", "Cẩm nang"],
  ["/contact", "Liên hệ"],
];

function NavigationLink({
  href,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "onNavigate"> & {
  onNavigate?: () => void;
}) {
  return href === "/" ? (
    <HomeLink {...props} />
  ) : (
    <Link href={href} scroll={false} {...props} />
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const navigateFromMenu = useMenuNavigation();
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchToggle = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const menuToggle = useRef<HTMLButtonElement>(null);
  function closeSearch() {
    setSearching(false);
    const target = searchToggle.current?.getClientRects().length
      ? searchToggle.current
      : menuToggle.current;
    target?.focus();
  }
  useEffect(() => {
    setOpen(false);
    setSearching(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        if (searching) closeSearch();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [searching]);
  function handleSearchClick() {
    setOpen(false);
    if (pathname === "/products") {
      const input = document.getElementById(
        "catalog-search-input",
      ) as HTMLInputElement | null;
      if (input) {
        input.scrollIntoView({ behavior: "smooth", block: "center" });
        input.focus();
      }
    } else {
      router.push("/products?focus=search#catalog-search");
    }
  }

  return (
    <header className="site-header">
      <div className="header-inner container">
        <BrandLink onNavigate={() => setOpen(false)} />
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navigation.map(([href, label]) => (
            <NavigationLink
              key={href}
              href={href}
              onNavigate={() => navigateFromMenu(href)}
              className={
                (href === "/" ? pathname === href : pathname.startsWith(href))
                  ? "active"
                  : ""
              }
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
              {href === "/products" && <Icon name="down" size={13} />}
            </NavigationLink>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button search-toggle"
            aria-label="Tìm kiếm sản phẩm"
            onClick={handleSearchClick}
          >
            <Icon name="search" />
          </button>
          <Link
            href="/quotation"
            className="button button-primary header-quote"
          >
            Nhận báo giá <Icon name="diagonal" size={16} />
          </Link>
          <button
            className="icon-button mobile-menu-toggle"
            ref={menuToggle}
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {searching && (
        <div className="header-search" id="header-search-panel">
          <div className="container">
            <form
              className="header-search-panel"
              role="search"
              aria-label="Tìm kiếm trên website"
              onSubmit={(event) => {
                event.preventDefault();
                const keyword = query.trim();
                router.push(
                  keyword
                    ? `/products?q=${encodeURIComponent(keyword)}`
                    : "/products",
                );
                setSearching(false);
              }}
            >
              <div className="header-search-heading">
                <label htmlFor="header-search-input">
                  Bạn đang tìm mẫu nào?
                </label>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Đóng tìm kiếm"
                  onClick={closeSearch}
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
              <div className="header-search-field">
                <Icon name="search" size={20} />
                <input
                  id="header-search-input"
                  ref={searchInput}
                  type="search"
                  autoFocus
                  aria-label="Tìm mẫu sản phẩm"
                  placeholder="Tên sản phẩm, mã mẫu hoặc loại cửa…"
                  maxLength={150}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                {query && (
                  <button
                    className="header-search-clear"
                    type="button"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => {
                      setQuery("");
                      searchInput.current?.focus();
                    }}
                  >
                    <Icon name="close" size={16} />
                  </button>
                )}
                <button className="header-search-submit" type="submit">
                  Tìm kiếm <Icon name="arrow" size={17} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {open && (
        <nav
          id="mobile-menu"
          className="mobile-nav"
          aria-label="Điều hướng trên điện thoại"
        >
          <button
            className="mobile-search-button"
            type="button"
            onClick={handleSearchClick}
          >
            Tìm kiếm sản phẩm <Icon name="search" size={18} />
          </button>
          {navigation.map(([href, label]) => (
            <NavigationLink
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              onNavigate={() => navigateFromMenu(href)}
            >
              {label}
              <Icon name="chevron" size={16} />
            </NavigationLink>
          ))}
          <Link
            href="/quotation"
            className="button button-primary"
            onClick={() => setOpen(false)}
          >
            Nhận báo giá <Icon name="arrow" size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
