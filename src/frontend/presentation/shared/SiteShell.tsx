"use client";
import type { SiteProviderProps } from "./SiteProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Header from "@/frontend/presentation/website/Header";
import Footer from "@/frontend/presentation/website/Footer";
import LiveChat from "@/frontend/presentation/website/LiveChat";
import { SiteProvider } from "@/frontend/presentation/shared/SiteProvider";
import ZaloContact from "@/frontend/presentation/website/ZaloContact";
import { HomeNavigationProvider } from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
export default function SiteShell({
  children,
  initialData,
  initialUser,
}: SiteProviderProps) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");
  return (
    <HomeNavigationProvider>
      <SiteProvider
        key={`${initialUser?.id || "guest"}:${initialUser?.role || ""}`}
        initialData={initialData}
        initialUser={initialUser}
      >
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
            <div
              className="floating-contact-actions"
              role="group"
              aria-label="Liên hệ tư vấn"
            >
              <Link
                href="/quotation"
                className="floating-form"
                aria-label="Gửi form tư vấn"
              >
                <Icon name="file" size={23} strokeWidth={1.7} />
                <span className="contact-action-label" aria-hidden="true">
                  Gửi form tư vấn
                </span>
              </Link>
              <ZaloContact />
              <LiveChat />
            </div>
          </>
        )}
      </SiteProvider>
    </HomeNavigationProvider>
  );
}
