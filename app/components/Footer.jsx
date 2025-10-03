import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const services = [
    "Cửa nhôm kính",
    "Vách kính",
    "Mái kính",
    "Cầu thang kính",
    "Lan can kính",
    "Cửa tự động",
  ];

  const quickLinks = [
    { name: "Trang Chủ", href: "/" },
    { name: "Giới Thiệu", href: "/about" },
    { name: "Dịch Vụ", href: "/services" },
    { name: "Liên Hệ", href: "/contact" },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center mb-4">
              <h3 className="text-2xl font-bold text-blue-400">
                Nhôm Kính Thành Phong
              </h3>
            </div>
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              Chuyên sản xuất và thi công các sản phẩm nhôm kính chất lượng cao.
              Với nhiều năm kinh nghiệm trong ngành, chúng tôi cam kết mang đến
              những giải pháp tốt nhất cho khách hàng.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Icons */}
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <span className="sr-only">YouTube</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <span className="sr-only">Zalo</span>
                <svg
                  className="h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm3.5 13.5c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5zm-7 0c-.828 0-1.5-.672-1.5-1.5s.672-1.5 1.5-1.5 1.5.672 1.5 1.5-.672 1.5-1.5 1.5z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              Dịch Vụ
            </h3>
            <ul className="space-y-2">
              {services.map((service, index) => (
                <li key={index}>
                  <Link
                    href="/services"
                    className="text-gray-300 hover:text-pink-400 text-sm transition-colors"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              Liên Kết Nhanh
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-pink-400 text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-400">
              Thông Tin Liên Hệ
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start">
                <svg
                  className="w-5 h-5 mr-2 mt-0.5 text-blue-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-300">
                  123 Đường ABC, Phường XYZ,
                  <br />
                  Quận 1, TP.HCM
                </span>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-gray-300">0123.456.789</span>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>

                <a
                  href="mailto:info@nhomkinhthanhphong.com"
                  className="text-gray-300"
                >
                  info@nhomkinhthanhphong.com
                </a>
              </div>

              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-blue-400 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029C10.792 13.807 10.304 14 10 14c-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-gray-300">
                  www.nhomkinhthanhphong.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-gray-700">
          <div className="text-center text-sm text-gray-400">
            © {currentYear} Nhôm Kính Thành Phong. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>
    </footer>
  );
}
