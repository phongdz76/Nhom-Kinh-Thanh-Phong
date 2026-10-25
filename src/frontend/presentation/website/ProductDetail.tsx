"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import {
  Breadcrumb,
  ConsultationCTA,
  EmptyState,
} from "@/frontend/presentation/shared/Shared";
import ProductCard from "@/frontend/presentation/website/ProductCard";
import Icon from "@/frontend/presentation/shared/Icon";
export default function ProductDetail({ id }: { id: string }) {
  const { publishedProducts: products, publicCategories: categories } =
    useSite();
  const [selectedImage, setSelectedImage] = useState(0);
  const product = products.find(
    (item) => item.id === id && item.status === "published",
  );
  if (!product)
    return (
      <div className="section container">
        <EmptyState
          title="Mẫu sản phẩm chưa được công bố"
          text="Mẫu này có thể đã được chuyển về bản nháp."
        >
          <Link href="/products" className="button button-primary">
            Xem các mẫu khác <Icon name="arrow" size={16} />
          </Link>
        </EmptyState>
      </div>
    );
  const gallery = product.images?.length ? product.images : [product.image];
  const image = gallery[Math.min(selectedImage, gallery.length - 1)];
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Sản phẩm", href: "/products" },
          { label: product.name },
        ]}
      />
      <section className="container detail-layout">
        <div className="detail-gallery">
          <div className="detail-main-image">
            <Image
              src={image}
              alt={`Ảnh minh họa ${product.name}`}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 55vw"
              unoptimized={image.startsWith("data:")}
            />
            <span className="image-tag">Hình ảnh tham khảo</span>
          </div>
          <div className="detail-thumbnails">
            {gallery.map((src, index) => (
              <button
                key={`${src}-${index}`}
                onClick={() => setSelectedImage(index)}
                className={selectedImage === index ? "selected" : ""}
                aria-label={`Xem ảnh ${index + 1}`}
                aria-pressed={selectedImage === index}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="100px"
                  unoptimized={src.startsWith("data:")}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {
              categories.find((category) => category.id === product.category)
                ?.name
            }{" "}
            · {product.code}
          </span>
          <h1>{product.name}</h1>
          <p className="detail-subtitle">{product.subtitle}</p>
          <p>{product.summary}</p>
          <dl className="specification-list">
            <div>
              <dt>Kiểu mở</dt>
              <dd>{product.opening || "Theo thiết kế"}</dd>
            </div>
            <div>
              <dt>Màu sắc gợi ý</dt>
              <dd>{product.color || "Theo yêu cầu"}</dd>
            </div>
            <div>
              <dt>Hệ nhôm & loại kính</dt>
              <dd>Tư vấn theo công trình</dd>
            </div>
            <div>
              <dt>Phụ kiện & kích thước</dt>
              <dd>Thống nhất sau khảo sát</dd>
            </div>
          </dl>
          <div className="detail-pricing">
            <span>BÁO GIÁ THEO CẤU HÌNH</span>
            <h2>Cùng tìm phương án phù hợp.</h2>
            <p>
              Chi phí phụ thuộc kích thước, vật liệu, phụ kiện và điều kiện thi
              công.
            </p>
          </div>
          <Link
            href={`/quotation?product=${product.id}`}
            className="button button-primary detail-quote"
          >
            Nhận tư vấn mẫu này <Icon name="diagonal" size={18} />
          </Link>
          <div className="detail-note">
            <Icon name="ruler" size={19} />
            Mẫu minh họa. Cấu hình cần được xác nhận trước khi thi công.
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">THÊM Ý TƯỞNG CHO NGÔI NHÀ</span>
            <h2>Có thể bạn cũng thích.</h2>
          </div>
          <Link href="/products" className="text-link">
            Xem bộ sưu tập <Icon name="arrow" size={16} />
          </Link>
        </div>
        <div className="product-grid">
          {products
            .filter((item) => item.status === "published" && item.id !== id)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
