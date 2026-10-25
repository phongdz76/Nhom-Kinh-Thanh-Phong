import { Breadcrumb, PageHeading } from "@/frontend/presentation/shared/Shared";
import ContactContent from "@/frontend/presentation/website/ContactContent";
export const metadata = { title: "Liên hệ & tư vấn" };
export default function ContactPage() {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Liên hệ" }]} />
        <PageHeading
          eyebrow="KẾT NỐI VỚI THANH PHONG"
          title="Cùng mở ra một không gian mới."
          description="Một ý tưởng nhỏ hôm nay có thể là khởi đầu cho góc sống bạn luôn mong muốn."
        />
      </div>
      <section className="section">
        <ContactContent />
      </section>
    </>
  );
}
