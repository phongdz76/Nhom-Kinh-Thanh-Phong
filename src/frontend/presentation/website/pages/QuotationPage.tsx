import { Breadcrumb, PageHeading } from "@/frontend/presentation/shared/Shared";
import ContactContent from "@/frontend/presentation/website/ContactContent";
import Icon from "@/frontend/presentation/shared/Icon";
export const metadata = { title: "Yêu cầu báo giá" };
export default function QuotationPage() {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Nhận báo giá" }]} />
        <PageHeading
          eyebrow="GIẢI PHÁP THEO CÔNG TRÌNH"
          title="Báo giá bắt đầu từ nhu cầu thật."
          description="Kích thước, hệ nhôm, loại kính và phụ kiện tạo nên phương án phù hợp với bạn."
        />
      </div>
      <div className="container quotation-factors">
        {[
          ["ruler", "Kích thước & vị trí"],
          ["layers", "Nhôm, kính & phụ kiện"],
          ["tool", "Điều kiện thi công"],
        ].map(([icon, label]) => (
          <div key={label}>
            <Icon name={icon} size={23} />
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="section">
        <ContactContent />
      </section>
    </>
  );
}
