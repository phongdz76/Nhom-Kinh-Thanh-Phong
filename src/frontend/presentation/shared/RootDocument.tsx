import type { SiteProviderProps } from "./SiteProvider";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "@/frontend/presentation/styles/globals.css";
import SiteShell from "@/frontend/presentation/shared/SiteShell";

const geistSans = Be_Vietnam_Pro({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Nhôm kính Thanh Phong",
    template: "%s | Nhôm kính Thanh Phong",
  },
  description:
    "Khám phá ý tưởng cửa nhôm, vách kính, mái kính và lan can cho không gian sống cùng Thanh Phong.",
  robots: { index: false, follow: false },
};

export default function RootDocument({
  children,
  initialData,
  initialUser,
}: SiteProviderProps) {
  return (
    <html lang="vi">
      <body
        id="top"
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SiteShell initialData={initialData} initialUser={initialUser}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
