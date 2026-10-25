// Illustrative records for explicit database seeding only.
export const categories = [
  { id: "all", name: "Tất cả sản phẩm", icon: "grid" },
  { id: "doors", name: "Cửa nhôm kính", icon: "door" },
  { id: "windows", name: "Cửa sổ", icon: "window" },
  { id: "glass", name: "Vách & cửa kính", icon: "layers" },
  { id: "railings", name: "Lan can kính", icon: "railing" },
  { id: "roofs", name: "Mái kính", icon: "roof" },
];
export const initialProducts = [
  {
    id: "1",
    code: "TP-001",
    name: "Cửa nhôm mở lùa toàn cảnh",
    category: "doors",
    image: "/images/hero-house.jpg",
    images: [
      "/images/hero-house.jpg",
      "/images/sliding-door.jpg",
      "/images/living-room.jpg",
    ],
    tag: "Không gian mở",
    subtitle: "Kết nối trong nhà và sân vườn",
    opening: "Mở lùa",
    color: "Xám ghi",
    summary:
      "Những đường khung gọn gàng, mở rộng tầm nhìn và kết nối không gian sống với thiên nhiên.",
    status: "published",
    featured: true,
  },
  {
    id: "2",
    code: "TP-002",
    name: "Cửa nhôm mở quay",
    category: "doors",
    image: "/images/bright-home.jpg",
    images: ["/images/bright-home.jpg", "/images/architecture.jpg"],
    tag: "Lựa chọn quen thuộc",
    subtitle: "Điểm đón chào cho ngôi nhà",
    opening: "Mở quay",
    color: "Đen nhám",
    summary:
      "Gợi ý cửa mở quay cho lối vào nhà, với thiết kế khung thanh thoát và nhiều lựa chọn số cánh.",
    status: "published",
    featured: true,
  },
  {
    id: "3",
    code: "TP-003",
    name: "Vách kính không gian sống",
    category: "glass",
    image: "/images/living-room.jpg",
    images: ["/images/living-room.jpg", "/images/hero-house.jpg"],
    tag: "Đón ánh sáng",
    subtitle: "Phân chia nhẹ nhàng, kết nối tự nhiên",
    opening: "Vách cố định",
    color: "Trong suốt",
    summary:
      "Gợi ý sử dụng các mảng kính để phân chia công năng mà vẫn giữ cảm giác thông thoáng cho căn phòng.",
    status: "published",
    featured: true,
  },
  {
    id: "4",
    code: "TP-004",
    name: "Lan can kính ban công",
    category: "railings",
    image: "/images/villa.jpg",
    images: ["/images/villa.jpg", "/images/architecture.jpg"],
    tag: "Tầm nhìn rộng mở",
    subtitle: "Một góc nhìn trọn vẹn hơn",
    opening: "Cố định",
    color: "Trong suốt",
    summary:
      "Ý tưởng lan can kính cho ban công và sân thượng. Cấu tạo và phương án lắp đặt cần được khảo sát theo công trình.",
    status: "published",
    featured: true,
  },
  {
    id: "5",
    code: "TP-005",
    name: "Cửa sổ đón nắng",
    category: "windows",
    image: "/images/living-room.jpg",
    images: ["/images/living-room.jpg", "/images/sliding-door.jpg"],
    tag: "Ánh sáng tự nhiên",
    subtitle: "Để mỗi ngày bắt đầu thật nhẹ nhàng",
    opening: "Mở quay",
    color: "Xám ghi",
    summary:
      "Gợi ý cửa sổ cho phòng khách, phòng ngủ và góc làm việc; lựa chọn cách mở phù hợp với vị trí lắp đặt.",
    status: "published",
    featured: false,
  },
  {
    id: "6",
    code: "TP-006",
    name: "Vách kính phòng tắm",
    category: "glass",
    image: "/images/bathroom.jpg",
    images: ["/images/bathroom.jpg"],
    tag: "Gọn gàng & tinh tế",
    subtitle: "Phân khu cho phòng tắm hiện đại",
    opening: "Mở quay",
    color: "Trong suốt",
    summary:
      "Tham khảo cách phân khu khô và ướt bằng kính, với bố trí phụ kiện phù hợp diện tích sử dụng.",
    status: "published",
    featured: false,
  },
  {
    id: "7",
    code: "TP-007",
    name: "Mái kính lấy sáng",
    category: "roofs",
    image: "/images/architecture.jpg",
    images: ["/images/architecture.jpg", "/images/bright-home.jpg"],
    tag: "Gần hơn với thiên nhiên",
    subtitle: "Đưa ánh sáng vào từng khoảng nhà",
    opening: "Cố định",
    color: "Xám ghi",
    summary:
      "Ý tưởng lấy sáng cho khoảng thông tầng hoặc mái hiên. Hệ khung, loại kính và thoát nước cần thiết kế riêng.",
    status: "published",
    featured: false,
  },
  {
    id: "8",
    code: "TP-008",
    name: "Cửa kính khung thanh mảnh",
    category: "doors",
    image: "/images/sliding-door.jpg",
    images: ["/images/sliding-door.jpg", "/images/hero-house.jpg"],
    tag: "Đường nét tối giản",
    subtitle: "Tinh giản đường khung, mở rộng cảm nhận",
    opening: "Mở lùa",
    color: "Đen nhám",
    summary:
      "Gợi ý mẫu cửa theo phong cách tối giản, dành nhiều diện tích hơn cho ánh sáng và tầm nhìn.",
    status: "published",
    featured: false,
  },
];
export const projects = [
  {
    id: "nha-vuon",
    title: "Khi ngôi nhà mở ra cùng thiên nhiên",
    type: "Biệt thự",
    image: "/images/villa.jpg",
    category: "villa",
    description:
      "Ý tưởng kết hợp cửa nhôm kính toàn cảnh, ban công kính và những khoảng hiên rộng.",
    products: ["1", "4"],
  },
  {
    id: "nha-pho",
    title: "Ánh sáng len vào từng góc sống",
    type: "Nhà phố",
    image: "/images/bright-home.jpg",
    category: "house",
    description:
      "Tham khảo cách đưa ánh sáng vào nhà qua những ô cửa và vách kính có khung tối giản.",
    products: ["2", "5", "7"],
  },
  {
    id: "khong-gian-mo",
    title: "Ranh giới nhẹ nhàng của không gian",
    type: "Nội thất",
    image: "/images/living-room.jpg",
    category: "interior",
    description:
      "Ý tưởng dùng kính để phân khu, giữ sự liên tục trong một không gian nội thất hiện đại.",
    products: ["3", "8"],
  },
];
export const articles = [
  {
    slug: "chon-kieu-mo-cua",
    title: "Mở quay hay mở lùa: đâu là lựa chọn cho ngôi nhà?",
    category: "Kinh nghiệm chọn cửa",
    image: "/images/hero-house.jpg",
    time: "4 phút đọc",
    intro:
      "Bắt đầu từ diện tích sử dụng, hướng gió và thói quen sinh hoạt để tìm kiểu cửa phù hợp.",
    sections: [
      {
        title: "Nhìn vào khoảng trống quanh cửa",
        text: "Cửa mở quay cần khoảng trống để cánh hoạt động. Cửa mở lùa di chuyển trên ray, nên có thể phù hợp ở vị trí cần giữ diện tích phía trước. Cần xem cả lối đi, đồ nội thất và khoảng mở thông thoáng mong muốn.",
      },
      {
        title: "Đặt nhu cầu sử dụng lên trước",
        text: "Với cửa chính, cần cân nhắc lối đi và tần suất sử dụng. Với cửa ra sân vườn, tầm nhìn và sự kết nối với bên ngoài có thể được ưu tiên. Mỗi kiểu mở có nhiều cấu hình, vì vậy nên xem bản vẽ cụ thể trước khi quyết định.",
      },
      {
        title: "Khảo sát trước khi chốt phương án",
        text: "Ghi lại chiều rộng, chiều cao dự kiến và chụp ảnh vị trí lắp đặt. Người tư vấn cần kiểm tra hiện trạng để đề xuất số cánh, hệ khung và phụ kiện thích hợp. Nội dung này là hướng dẫn tham khảo, không thay thế khảo sát kỹ thuật.",
      },
    ],
  },
  {
    slug: "chuan-bi-truoc-khi-bao-gia",
    title: "Cần chuẩn bị gì để nhận một báo giá phù hợp?",
    category: "Tư vấn thi công",
    image: "/images/architecture.jpg",
    time: "3 phút đọc",
    intro:
      "Một vài thông tin rõ ràng từ đầu sẽ giúp quá trình tư vấn và khảo sát thuận tiện hơn.",
    sections: [
      {
        title: "Ảnh và vị trí công trình",
        text: "Chụp ảnh tổng thể khu vực cần làm cửa hoặc vách kính. Cho biết loại công trình và khu vực thi công để đơn vị thực hiện chuẩn bị phương án khảo sát.",
      },
      {
        title: "Kích thước và mong muốn",
        text: "Nếu có, cung cấp kích thước dự kiến hoặc bản vẽ. Nêu rõ cách mở, màu sắc và những điều quan trọng với gia đình. Kích thước cuối cùng cần được kiểm tra trực tiếp.",
      },
      {
        title: "Đọc kỹ phạm vi báo giá",
        text: "Hỏi rõ hệ nhôm, loại kính, phụ kiện, vật tư, công lắp đặt, vận chuyển và những chi phí chưa bao gồm. So sánh các báo giá trên cùng một cấu hình thay vì chỉ nhìn vào giá theo mét vuông.",
      },
    ],
  },
  {
    slug: "cham-soc-cua-nhom-kinh",
    title: "Giữ cửa nhôm kính sạch đẹp trong sinh hoạt hằng ngày",
    category: "Chăm sóc & sử dụng",
    image: "/images/sliding-door.jpg",
    time: "3 phút đọc",
    intro:
      "Chăm sóc nhẹ nhàng, đúng cách giúp việc sử dụng cửa thuận tiện và giữ bề mặt sạch sẽ.",
    sections: [
      {
        title: "Làm sạch bằng vật liệu mềm",
        text: "Dùng khăn mềm và dung dịch làm sạch được nhà cung cấp khuyến nghị. Tránh chà xát bằng vật sắc hoặc hóa chất mạnh khi chưa kiểm tra tính phù hợp với bề mặt.",
      },
      {
        title: "Giữ ray cửa thông thoáng",
        text: "Với cửa lùa, thường xuyên lấy bụi và vật nhỏ khỏi ray. Kiểm tra lỗ thoát nước nếu có. Không cố đẩy mạnh khi cánh bị kẹt hoặc xuất hiện tiếng lạ.",
      },
      {
        title: "Liên hệ khi có bất thường",
        text: "Nếu khóa khó thao tác, cửa xệ hoặc kính có dấu hiệu hỏng, liên hệ đơn vị lắp đặt để kiểm tra. Việc điều chỉnh phụ kiện và xử lý kính nên được thực hiện bởi người có chuyên môn.",
      },
    ],
  },
];
export const initialSettings = {
  name: "Thanh Phong",
  tagline: "Nhôm kính cho không gian sống",
  phone: "",
  zalo: "",
  email: "",
  address: "",
  hours: "Liên hệ để hẹn lịch tư vấn",
};
