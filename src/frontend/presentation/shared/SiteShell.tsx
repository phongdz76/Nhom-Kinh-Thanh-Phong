"use client";
import type { SiteProviderProps } from "./SiteProvider";
import { usePathname } from "next/navigation";
import Header from "@/frontend/presentation/website/Header";
import Footer from "@/frontend/presentation/website/Footer";
import LiveChat from "@/frontend/presentation/website/LiveChat";
import { SiteProvider } from "@/frontend/presentation/shared/SiteProvider";
import ZaloContact from "@/frontend/presentation/website/ZaloContact";
import { HomeNavigationProvider } from "@/frontend/presentation/shared/BrandLink";
export default function SiteShell({
  children,
  initialData,
  initialUser,
}: SiteProviderProps) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return (
    <HomeNavigationProvider>
      <SiteProvider initialData={initialData} initialUser={initialUser}>
        {admin ? (
          children
        ) : (
          <>
            <a className="skip-link" href="#main-content">
              Đến nội dung chính
            </a>
            <Header />
            <main id="main-content">{children}</main>
            <Footer />
            <ZaloContact />
            <LiveChat />
          </>
        )}
      </SiteProvider>
    </HomeNavigationProvider>
  );
}
