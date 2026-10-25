import type { Project, Product } from "@/domain/models";
import Image from "next/image";
import Link from "next/link";
import {
  Breadcrumb,
  PageHeading,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
import Icon from "@/frontend/presentation/shared/Icon";
export default function ProjectPage({
  project,
  related,
}: {
  project: Project;
  related: Product[];
}) {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Không gian ứng dụng", href: "/projects" },
          { label: project.type },
        ]}
      />
      <PageHeading
        eyebrow={`${project.type} · Ý TƯỞNG ỨNG DỤNG`}
        title={project.title}
        description={project.description}
      />
      <div className="container project-detail-image">
        <Image
          src={project.image}
          alt="Ảnh minh họa không gian ứng dụng nhôm kính"
          fill
          priority
          sizes="100vw"
        />
      </div>
      <section className="section container project-detail-text">
        <div>
          <span className="eyebrow">GỢI Ý CHO KHÔNG GIAN</span>
          <h2>
            Từ cảm hứng
            <br />
            đến lựa chọn của bạn.
          </h2>
        </div>
        <div>
          <p>
            Ảnh trong bộ sưu tập giúp hình dung cách bố trí cửa, kính và khoảng
            mở. Phương án vật liệu và lắp đặt cho mỗi ngôi nhà cần được khảo sát
            và trao đổi riêng.
          </p>
          <p className="inline-notice">
            Đây là ý tưởng minh họa, không phải công trình đã thi công của Thanh
            Phong.
          </p>
          <h3>Các nhóm mẫu có thể tham khảo</h3>
          <div className="project-product-links">
            {related.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id}>
                {product.name}
                <Icon name="diagonal" size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
