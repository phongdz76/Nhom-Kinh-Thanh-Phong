import type { Article } from "@/domain/models";
import Image from "next/image";
import {
  Breadcrumb,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
export default function ArticlePage({ article }: { article: Article }) {
  return (
    <>
      <Breadcrumb
        items={[
          { label: "Cẩm nang", href: "/news" },
          { label: article.category },
        ]}
      />
      <article className="article-layout container">
        <header>
          <span className="eyebrow">
            {article.category} · {article.time}
          </span>
          <h1>{article.title}</h1>
          <p className="article-intro">{article.intro}</p>
        </header>
        <div className="article-cover">
          <Image
            src={article.image}
            alt="Ảnh không gian minh họa"
            fill
            priority
            sizes="(max-width: 900px) 100vw, 900px"
          />
        </div>
        <div className="article-body">
          {article.sections.map((section, index) => (
            <section key={section.title}>
              <h2>
                {index + 1}. {section.title}
              </h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
      </article>
      <ConsultationCTA />
    </>
  );
}
