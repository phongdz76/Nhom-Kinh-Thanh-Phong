"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/frontend/presentation/shared/Icon";
import ProductCard from "@/frontend/presentation/website/ProductCard";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import { processSteps } from "@/frontend/presentation/website/data/process-steps";
import {
  ConsultationCTA,
  EmptyState,
} from "@/frontend/presentation/shared/Shared";

export default function HomePage() {
  const {
    publishedProducts: products,
    publicCategories: categories,
    publicProjects: projects,
    publicArticles: articles,
  } = useSite();
  const [category, setCategory] = useState("all");
  const visible = products
    .filter(
      (item) =>
        item.status === "published" &&
        (category === "all" ? item.featured : item.category === category),
    )
    .slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-copy-inner">
            <span className="eyebrow">THANH PHONG · ALUMINUM & GLASS</span>
            <h1>
              Mở tầm nhìn.
              <br />
              Chạm <span>không gian.</span>
            </h1>
            <p>
              Những đường nhôm tinh gọn. Những mảng kính đón sáng.
              <br className="desktop-break" /> Cùng kiến tạo không gian sống
              theo cách của bạn.
            </p>
            <div className="hero-buttons">
              <Link href="/products" className="button button-primary">
                Khám phá sản phẩm <Icon name="diagonal" size={17} />
              </Link>
              <Link href="/quotation" className="hero-secondary">
                Tư vấn cho ngôi nhà <Icon name="arrow" size={17} />
              </Link>
            </div>
            <div className="hero-foot">
              <span className="hero-foot-symbol">
                <Icon name="window" size={25} />
              </span>
              <div>
                <strong>Đẹp từ đường nét. Hợp từng nhu cầu.</strong>
                <span>Cửa nhôm · Vách kính · Lan can · Mái kính</span>
              </div>
            </div>
          </div>
          <span className="hero-lines" aria-hidden="true" />
        </div>
        <div className="hero-visual">
          <Image
            src="/images/hero-house.jpg"
            alt="Không gian sống với cửa kính lớn nhìn ra khoảng hiên — ảnh minh họa"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 55vw"
          />
        </div>
      </section>
      <section className="benefit-strip">
        <div className="container benefit-grid">
          {[
            [
              "ruler",
              "Phù hợp từng công trình",
              "Giải pháp bắt đầu từ nhu cầu",
            ],
            ["sun", "Rộng mở & đón sáng", "Gợi mở không gian sống"],
            [
              "layers",
              "Rõ ràng từng cấu hình",
              "Trao đổi vật liệu, kính & phụ kiện",
            ],
            ["message", "Kết nối cùng bạn", "Tư vấn trước khi lựa chọn"],
          ].map(([icon, title, text]) => (
            <div className="benefit" key={title}>
              <Icon name={icon} size={27} />
              <div>
                <strong>{title}</strong>
                <span>{text}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="section products-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">GIẢI PHÁP NHÔM KÍNH</span>
              <h2>
                Tinh gọn đường nét.
                <br />
                Trọn vẹn không gian.
              </h2>
            </div>
            <div className="heading-aside">
              <p>
                Tìm cảm hứng cho từng ô cửa, góc nhà
                <br />
                và những khoảng không bạn yêu thích.
              </p>
              <Link href="/products" className="text-link">
                Tất cả sản phẩm <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
          <div className="category-tabs" aria-label="Nhóm sản phẩm">
            {categories.map((item) => (
              <button
                key={item.id}
                className={category === item.id ? "selected" : ""}
                onClick={() => setCategory(item.id)}
                aria-pressed={category === item.id}
              >
                <Icon name={item.icon} size={18} />
                {item.id === "all" ? "Nổi bật" : item.name}
              </button>
            ))}
          </div>
          <div className="product-grid">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {visible.length === 0 && (
            <EmptyState
              title="Bộ sưu tập đang được cập nhật"
              text="Khám phá thêm các nhóm sản phẩm khác."
            />
          )}
        </div>
      </section>
      <section className="section about-section">
        <div className="container about-grid">
          <div className="about-collage">
            <div className="about-main-photo">
              <Image
                src="/images/architecture.jpg"
                alt="Ý tưởng kiến trúc nhà hiện đại với những khoảng mở bằng kính"
                fill
                sizes="(max-width: 760px) 100vw, 40vw"
              />
            </div>
            <div className="about-small-photo">
              <Image
                src="/images/sliding-door.jpg"
                alt="Không gian nội thất đón sáng — hình minh họa"
                fill
                sizes="(max-width: 760px) 40vw, 20vw"
              />
            </div>
            <div className="about-photo-label">
              <span>THANH PHONG</span>
              <strong>
                Góc nhìn mới
                <br />
                cho tổ ấm.
              </strong>
            </div>
          </div>
          <div className="about-copy">
            <span className="eyebrow">VỀ THANH PHONG</span>
            <h2>
              Mỗi ô cửa mở ra
              <br />
              một cách sống.
            </h2>
            <p>
              Không chỉ là phần ngăn chia, cửa và kính còn kết nối ánh sáng,
              thiên nhiên và những khoảnh khắc trong ngôi nhà.
            </p>
            <p>
              Thanh Phong hướng đến những giải pháp nhôm kính hài hòa giữa thẩm
              mỹ, công năng và nhu cầu riêng của mỗi không gian.
            </p>
            <div className="about-points">
              <span>
                <Icon name="check" size={17} />
                Lựa chọn theo không gian thực tế
              </span>
              <span>
                <Icon name="check" size={17} />
                Trao đổi rõ vật liệu và phương án
              </span>
            </div>
            <Link href="/about" className="text-link">
              Câu chuyện Thanh Phong <Icon name="arrow" size={18} />
            </Link>
          </div>
        </div>
      </section>
      <section className="section inspiration-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CẢM HỨNG KIẾN TRÚC</span>
              <h2>
                Nhôm kính trong
                <br />
                những không gian sống.
              </h2>
            </div>
            <div className="heading-aside">
              <p>
                Một vài ý tưởng ứng dụng để bạn
                <br />
                hình dung ngôi nhà của mình.
              </p>
              <Link href="/projects" className="text-link">
                Khám phá không gian <Icon name="arrow" size={17} />
              </Link>
            </div>
          </div>
          <div className="project-grid">
            {projects.map((project, index) => (
              <Link
                href={`/projects/${project.id}`}
                className="project-card"
                key={project.id}
              >
                <div className="project-image">
                  <Image
                    src={project.image}
                    alt={`Ảnh minh họa ${project.type.toLowerCase()}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                  <span className="project-number">0{index + 1}</span>
                  <span className="card-open">
                    <Icon name="diagonal" />
                  </span>
                </div>
                <span className="project-type">
                  {project.type} · Ý tưởng ứng dụng
                </span>
                <h3>{project.title}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section process-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">TỪ Ý TƯỞNG ĐẾN KHÔNG GIAN</span>
              <h2>Cùng bạn qua từng bước.</h2>
            </div>
            <p className="heading-description">
              Một quy trình trao đổi rõ ràng để mỗi lựa chọn
              <br />
              đều phù hợp với công trình.
            </p>
          </div>
          <div className="process-grid">
            {processSteps.map((step, index) => (
              <div className="process-card" key={step.number}>
                <div className="process-card-header">
                  <span className="process-step-num">{index + 1}</span>
                  <Icon name={step.icon} size={28} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section journal-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">CẨM NANG CHO NGÔI NHÀ</span>
              <h2>Hiểu thêm, chọn đúng.</h2>
            </div>
            <Link href="/news" className="text-link">
              Góc kiến thức <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="journal-grid">
            {articles.map((article) => (
              <Link
                href={`/news/${article.slug}`}
                key={article.slug}
                className="journal-card"
              >
                <div className="journal-image">
                  <Image
                    src={article.image}
                    alt="Ảnh không gian minh họa bài viết"
                    fill
                    sizes="(max-width: 760px) 100vw, 33vw"
                  />
                </div>
                <span className="journal-meta">
                  {article.category} <i /> {article.time}
                </span>
                <h3>{article.title}</h3>
                <span className="journal-read">
                  Đọc bài viết <Icon name="arrow" size={16} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
