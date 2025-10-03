import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Nhôm Kính Thanh Phong - Chuyên gia nhôm kính chất lượng cao",
  description:
    "Chuyên sản xuất và thi công các sản phẩm nhôm kính: cửa nhôm kính, vách kính, mái kính, cầu thang kính, lan can kính chất lượng cao tại TP.HCM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
