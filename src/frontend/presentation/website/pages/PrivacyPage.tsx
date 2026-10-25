import { Breadcrumb, PageHeading } from "@/frontend/presentation/shared/Shared";
export const metadata = { title: "Thông tin & quyền riêng tư" };
export default function PrivacyPage() {
  return (
    <>
      <Breadcrumb items={[{ label: "Thông tin & quyền riêng tư" }]} />
      <PageHeading
        eyebrow="THÔNG TIN & QUYỀN RIÊNG TƯ"
        title="Cách thông tin của bạn được tiếp nhận."
      />
      <div className="container legal-content">
        <h2>Thông tin khi yêu cầu tư vấn</h2>
        <p>
          Form tiếp nhận họ tên, số điện thoại và những nội dung bạn chủ động
          cung cấp như email, khu vực công trình, mẫu quan tâm và ghi chú. Bạn
          không cần tạo tài khoản để gửi yêu cầu.
        </p>
        <h2>Mục đích và nơi lưu trữ</h2>
        <p>
          Yêu cầu được lưu trong cơ sở dữ liệu của website để người phụ trách
          liên hệ, tư vấn và theo dõi quá trình xử lý. Việc gửi form không được
          hiểu là đăng ký nhận quảng cáo. Khi kênh thông báo được cấu hình, cơ
          sở nhận mã yêu cầu và liên kết vào quản trị để xem chi tiết.
        </p>
        <h2>Trò chuyện trực tiếp</h2>
        <p>
          Khi kênh chat được bật, khung tawk.to chỉ tải sau khi bạn bấm “Chat tư
          vấn”. Nội dung trò chuyện và thông tin bạn chủ động cung cấp được xử
          lý trên nền tảng tawk.to để người phụ trách trả lời. Bạn cũng có thể
          sử dụng form tư vấn hoặc thông tin liên hệ trên website.
        </p>
        <h2>Truy cập và bảo vệ thông tin</h2>
        <p>
          Danh sách khách hàng không được công bố. Phần quản trị yêu cầu đăng
          nhập và kiểm tra quyền trên máy chủ. Trình duyệt dùng cookie đăng nhập
          chỉ cho phép máy chủ đọc; thông tin khách hàng không lưu trong
          localStorage.
        </p>
        <h2>Kiểm tra hoặc cập nhật yêu cầu</h2>
        <p>
          Liên hệ cơ sở qua thông tin ở trang Liên hệ và cung cấp mã yêu cầu nếu
          bạn muốn kiểm tra, sửa hoặc đề nghị xử lý thông tin đã gửi. Tránh đưa
          dữ liệu nhạy cảm không cần thiết vào ô ghi chú. Nội dung và thông tin
          liên hệ chính thức cần được chủ cơ sở xác nhận trước khi phát hành
          website.
        </p>
      </div>
    </>
  );
}
