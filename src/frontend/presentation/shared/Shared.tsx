import Link from "next/link";
import { HomeLink } from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
export function Breadcrumb({
  items = [],
}: {
  items?: { label: string; href?: string }[];
}) {
  return (
    <nav className="breadcrumb container" aria-label="Đường dẫn">
      <HomeLink>Trang chủ</HomeLink>
      {items.map((item, index) => (
        <span key={index}>
          <Icon name="chevron" size={12} />
          {item.href ? (
            <Link href={item.href}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="page-heading container">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
export function ConsultationCTA() {
  return (
    <section className="consultation-cta">
      <div className="container cta-inner">
        <div>
          <span className="eyebrow">MỖI KHÔNG GIAN, MỘT GIẢI PHÁP</span>
          <h2>
            Ý tưởng của bạn.
            <br />
            Cùng Thanh Phong bắt đầu.
          </h2>
          <p className="cta-description">
            Chia sẻ nhu cầu để tìm phương án nhôm kính phù hợp với ngôi nhà.
          </p>
        </div>
        <Link href="/quotation" className="button button-primary">
          Trao đổi về công trình <Icon name="diagonal" size={18} />
        </Link>
        <span className="cta-drawing" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      </div>
    </section>
  );
}
export function EmptyState({
  title = "Chưa có nội dung",
  text,
  children,
}: {
  title?: string;
  text?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <Icon name="search" size={30} />
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children}
    </div>
  );
}
