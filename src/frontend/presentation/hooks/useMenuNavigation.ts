"use client";
import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const scrollToStart = () =>
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });

export function useMenuNavigation() {
  const pathname = usePathname();
  const pendingPath = useRef<string | null>(null);

  useLayoutEffect(() => {
    if (pendingPath.current !== pathname) return;
    pendingPath.current = null;
    scrollToStart();
  }, [pathname]);

  useEffect(() => {
    // Cancel a pending menu request when browser history takes over, so this
    // hook does not apply a stale request during Back/Forward navigation.
    const cancelPending = () => {
      pendingPath.current = null;
    };
    window.addEventListener("popstate", cancelPending);
    return () => window.removeEventListener("popstate", cancelPending);
  }, []);

  return (href: string) => {
    const target = new URL(href, window.location.href);
    // HomeNavigationProvider handles the animated trip back to the homepage.
    if (
      target.pathname === "/" ||
      target.hash ||
      target.origin !== window.location.origin
    )
      return;
    if (target.pathname === pathname) {
      pendingPath.current = null;
      scrollToStart();
    } else pendingPath.current = target.pathname;
  };
}
