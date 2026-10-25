import type { Product } from "@/domain/models";
import Link from "next/link";
import Image from "next/image";
import Icon from "@/frontend/presentation/shared/Icon";
export default function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        href={`/products/${product.id}`}
        className="product-image"
        aria-label={`Xem ${product.name}`}
      >
        <Image
          src={product.image}
          alt={`Ảnh minh họa ${product.name.toLowerCase()}`}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1000px) 50vw, 25vw"
          unoptimized={product.image.startsWith("data:")}
        />
        <span className="image-tag">{product.tag || "Mẫu tham khảo"}</span>
        <span className="card-open">
          <Icon name="diagonal" size={20} />
        </span>
      </Link>
      <div className="product-content">
        <span className="product-code">
          {product.code} <i /> {product.opening || "Theo công trình"}
        </span>
        <h3>
          <Link href={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p>{product.subtitle || product.summary}</p>
        <div className="product-bottom">
          <span>Tư vấn theo cấu hình</span>
          <Link
            href={`/quotation?product=${product.id}`}
            aria-label={`Nhận báo giá ${product.name}`}
          >
            <Icon name="arrow" size={19} />
          </Link>
        </div>
      </div>
    </article>
  );
}
