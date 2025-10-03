export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Chuyên Gia Nhôm Kính
              <span className="block text-blue-200">Thành Phong</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Sản xuất và thi công các sản phẩm nhôm kính chất lượng cao với
              nhiều năm kinh nghiệm
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Liên Hệ Tư Vấn
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Xem Dịch Vụ
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Dịch Vụ Của Chúng Tôi
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Chúng tôi cung cấp đầy đủ các dịch vụ nhôm kính từ thiết kế đến
              thi công hoàn thiện
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Cửa Nhôm Kính",
                description:
                  "Thiết kế và thi công cửa nhôm kính cao cấp, bền đẹp theo thời gian",
                icon: "🚪",
              },
              {
                title: "Vách Kính",
                description:
                  "Vách kính văn phòng, showroom tạo không gian rộng rãi và hiện đại",
                icon: "🏢",
              },
              {
                title: "Mái Kính",
                description:
                  "Mái kính thông minh cho ánh sáng tự nhiên và thẩm mỹ cao",
                icon: "🏠",
              },
              {
                title: "Cầu Thang Kính",
                description:
                  "Cầu thang kính sang trọng, an toàn với thiết kế hiện đại",
                icon: "🪜",
              },
              {
                title: "Lan Can Kính",
                description:
                  "Lan can kính chắc chắn, đảm bảo an toàn và tính thẩm mỹ",
                icon: "🏗️",
              },
              {
                title: "Cửa Tự Động",
                description:
                  "Hệ thống cửa tự động thông minh, tiện nghi cho mọi công trình",
                icon: "🔄",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Tại Sao Chọn Chúng Tôi?
              </h2>
              <div className="space-y-6">
                {[
                  {
                    title: "Kinh Nghiệm Lâu Năm",
                    description:
                      "Hơn 10 năm kinh nghiệm trong lĩnh vực nhôm kính",
                  },
                  {
                    title: "Chất Lượng Cao",
                    description:
                      "Sử dụng vật liệu nhập khẩu chính hãng, đảm bảo độ bền",
                  },
                  {
                    title: "Đội Ngũ Chuyên Nghiệp",
                    description:
                      "Thợ thi công có tay nghề cao, được đào tạo bài bản",
                  },
                  {
                    title: "Bảo Hành Dài Hạn",
                    description:
                      "Chế độ bảo hành lên đến 5 năm cho tất cả sản phẩm",
                  },
                ].map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-4 mt-1">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-8">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Liên Hệ Ngay
                </h3>
                <p className="text-gray-600 mb-6">
                  Để được tư vấn miễn phí và báo giá chi tiết
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-lg font-semibold">0123.456.789</span>
                  </div>
                  <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Gọi Ngay
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
