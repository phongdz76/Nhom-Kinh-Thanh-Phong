import Catalog from "@/frontend/presentation/website/Catalog";
import { Suspense } from "react";
import {
  Breadcrumb,
  PageHeading,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
export const metadata = { title: "Bộ sưu tập sản phẩm" };
export default function ProductsPage() {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Sản phẩm" }]} />
        <PageHeading
          eyebrow="BỘ SƯU TẬP THANH PHONG"
          title="Một lựa chọn. Một không gian mới."
          description="Khám phá những ý tưởng nhôm kính và tìm mẫu phù hợp với ngôi nhà của bạn."
        />
      </div>
      <section className="section catalog-section">
        <Suspense
          fallback={
            <div className="container empty-state">Đang mở bộ sưu tập...</div>
          }
        >
          <Catalog />
        </Suspense>
      </section>
      <ConsultationCTA />
    </>
  );
}
