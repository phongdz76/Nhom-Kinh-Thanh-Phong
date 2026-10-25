"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useLayoutEffect, useRef } from "react";
import Brand from "@/frontend/presentation/shared/Brand";

type NavigateEvent = { preventDefault(): void };
type HomeLinkProps = Omit<
  React.ComponentProps<typeof Link>,
  "href" | "onNavigate"
> & { onNavigate?: () => void };
const HomeNavigationContext = createContext<
  ((event: NavigateEvent) => void) | null
>(null);

function scrollToTop() {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
  });
}

export function HomeNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pendingScroll = useRef<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!pendingScroll.current) return;
    const position = pendingScroll.current;
    pendingScroll.current = null;
    if (pathname !== "/") return;
    // Route changes can restore a cached position. Start the animation from
    // the position where the logo was clicked, before painting the new page.
    window.scrollTo({ ...position, behavior: "instant" });
    const frame = requestAnimationFrame(scrollToTop);
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  function navigateHome(event: NavigateEvent) {
    if (window.location.pathname === "/") {
      event.preventDefault();
      if (window.location.hash || window.location.search) {
        window.history.replaceState(window.history.state, "", "/");
      }
      scrollToTop();
    } else {
      // Keep the current position until the home page has rendered.
      pendingScroll.current = { top: window.scrollY, left: window.scrollX };
    }
  }

  return (
    <HomeNavigationContext.Provider value={navigateHome}>
      {children}
    </HomeNavigationContext.Provider>
  );
}

export function HomeLink({ onNavigate, ...props }: HomeLinkProps) {
  const navigateHome = useContext(HomeNavigationContext);
  return (
    <Link
      href="/"
      scroll={false}
      {...props}
      onNavigate={(event) => {
        onNavigate?.();
        navigateHome?.(event);
      }}
    />
  );
}

export default function BrandLink({
  light = false,
  ...props
}: HomeLinkProps & { light?: boolean }) {
  return (
    <HomeLink aria-label="Thanh Phong — Trang chủ" {...props}>
      <Brand light={light} />
    </HomeLink>
  );
}
