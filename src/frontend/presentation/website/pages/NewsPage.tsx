import type { Article } from "@/domain/models";
import Link from "next/link";
import Image from "next/image";
import {
  Breadcrumb,
  PageHeading,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
import Icon from "@/frontend/presentation/shared/Icon";
export const metadata = { title: "Cẩm nang nhôm kính" };
export default function NewsPage({ articles }: { articles: Article[] }) {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Cẩm nang" }]} />
        <PageHeading
          eyebrow="GÓC KIẾN THỨC CHO NGÔI NHÀ"
          title="Hiểu thêm để chọn phù hợp."
          description="Những điều nên biết trước khi chọn cửa, trao đổi báo giá và chăm sóc nhôm kính."
        />
      </div>
      <section className="section container">
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
                  alt="Ảnh minh họa bài viết"
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
              </div>
              <span className="journal-meta">
                {article.category} <i /> {article.time}
              </span>
              <h2>{article.title}</h2>
              <p>{article.intro}</p>
              <span className="journal-read">
                Đọc bài viết <Icon name="arrow" size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <ConsultationCTA />
    </>
  );
}
