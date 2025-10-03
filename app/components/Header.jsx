"use client";

import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigation = [
    { name: "Trang Chủ", href: "/" },
    { name: "Giới Thiệu", href: "/about" },
    { name: "Dịch Vụ", href: "/services" },
    { name: "Sản Phẩm", href: "/products" },
    { name: "Tin Tức", href: "/news" },
    { name: "Liên Hệ", href: "/contact" },
  ];

  return (
    <header className="bg-white shadow-lg sticky top-0 z-50">
      {/* Top Bar - Logo, Search, Cart, Login */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* Logo (Left) */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="text-xl font-bold text-blue-600">
                  Nhôm Kính Thanh Phong
                </span>
              </Link>
            </div>

            {/* Search Bar (Center) - Hidden on mobile */}
            <div className="hidden sm:flex flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm, dịch vụ..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Cart & Login (Right) */}
            <div className="flex items-center space-x-3">
              {/* Cart */}
              <button className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l-2.5 5M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6"
                  />
                </svg>
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </button>

              {/* Login Buttons */}
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-blue-600 px-3 py-1 text-sm font-medium transition-colors"
                >
                  Đăng Nhập
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Đăng Ký
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  type="button"
                  className="bg-gray-50 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                  aria-controls="mobile-menu"
                  aria-expanded="false"
                >
                  <span className="sr-only">Mở menu chính</span>
                  {!isMobileMenuOpen ? (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="block h-6 w-6"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Hidden on mobile */}
      <nav className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Contact Info (Left) */}
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              0123.456.789
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              info@nhomkinhthanhphong.com
            </div>
          </div>

          {/* Desktop Navigation (Center) */}
          <div className="flex items-center">
            <div className="flex items-baseline space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
              {/* Mobile Search */}
              <div className="px-3 py-2 mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Login/Register */}
              <div className="px-3 py-2 border-t border-gray-200 mt-2 space-y-2">
                <Link
                  href="/login"
                  className="block w-full text-center bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng Nhập
                </Link>
                <Link
                  href="/register"
                  className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Đăng Ký
                </Link>
              </div>

              {/* Mobile Contact Info */}
              <div className="px-3 py-2 border-t border-gray-200 mt-2">
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  0123.456.789
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                  info@nhomkinhthanhphong.com
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
