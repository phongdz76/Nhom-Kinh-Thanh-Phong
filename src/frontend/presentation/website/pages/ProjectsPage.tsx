import {
  Breadcrumb,
  PageHeading,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
import ProjectGallery from "@/frontend/presentation/website/ProjectGallery";
export const metadata = { title: "Không gian ứng dụng" };
export default function ProjectsPage() {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Công trình & cảm hứng" }]} />
        <PageHeading
          eyebrow="CẢM HỨNG KIẾN TRÚC"
          title="Hình dung không gian của bạn."
          description="Khám phá cách nhôm kính kết nối kiến trúc, ánh sáng và cuộc sống."
        />
      </div>
      <section className="section container">
        <p className="inline-notice">
          Bộ sưu tập hình ảnh minh họa ứng dụng. Hồ sơ công trình thực tế của
          Thanh Phong sẽ được bổ sung sau.
        </p>
        <ProjectGallery />
      </section>
      <ConsultationCTA />
    </>
  );
}
