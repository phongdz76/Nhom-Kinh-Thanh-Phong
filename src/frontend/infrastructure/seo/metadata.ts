import type { Metadata, MetadataRoute } from "next";
import type { PublicSite, Settings } from "@/domain/models";

type Environment = Record<string, string | undefined>;
export const siteDescription =
  "Thanh Phong tư vấn cửa nhôm kính, vách kính, lan can và mái kính. Tìm giải pháp phù hợp, xem sản phẩm và gửi yêu cầu khảo sát, báo giá.";

export function websiteOrigin(env: Environment): string | null {
  try {
    const url = new URL(env.SERVER_URL || "");
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function canIndexWebsite(env: Environment) {
  return Boolean(
    websiteOrigin(env) &&
    env.NODE_ENV === "production" &&
    (!env.CONTEXT || env.CONTEXT === "production") &&
    env.SITE_INDEXING_ENABLED !== "false",
  );
}

export function pageMetadata(
  env: Environment,
  path: string,
  title: string,
  description = siteDescription,
  image?: string,
  article = false,
): Metadata {
  const origin = websiteOrigin(env);
  const url = origin ? new URL(path, origin).href : undefined;
  const index = canIndexWebsite(env);
  const fullTitle =
    title === "Nhôm kính Thanh Phong"
      ? title
      : `${title} | Nhôm kính Thanh Phong`;
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: { index, follow: index },
    openGraph: {
      type: article ? "article" : "website",
      locale: "vi_VN",
      siteName: "Nhôm kính Thanh Phong",
      title: fullTitle,
      description,
      url,
      ...(origin && image
        ? { images: [{ url: new URL(image, origin).href, alt: title }] }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: fullTitle,
      description,
      ...(origin && image ? { images: [new URL(image, origin).href] } : {}),
    },
  };
}

export const publicPages = [
  ["/", "Nhôm kính Thanh Phong", siteDescription],
  [
    "/about",
    "Về Thanh Phong",
    "Tìm hiểu Thanh Phong và cách lựa chọn giải pháp nhôm kính phù hợp cho từng không gian.",
  ],
  [
    "/products",
    "Sản phẩm nhôm kính",
    "Khám phá cửa nhôm, cửa sổ, vách kính, lan can và mái kính. Xem cấu hình và gửi yêu cầu tư vấn.",
  ],
  [
    "/projects",
    "Không gian ứng dụng",
    "Tham khảo các không gian ứng dụng cửa nhôm và kính, ý tưởng thiết kế và giải pháp phù hợp.",
  ],
  [
    "/news",
    "Cẩm nang nhôm kính",
    "Kinh nghiệm chọn cửa nhôm kính, tư vấn thi công, chăm sóc và sử dụng sản phẩm.",
  ],
  [
    "/contact",
    "Liên hệ Thanh Phong",
    "Liên hệ Thanh Phong để trao đổi nhu cầu, tư vấn cửa nhôm kính và hẹn khảo sát công trình.",
  ],
  [
    "/quotation",
    "Yêu cầu báo giá nhôm kính",
    "Gửi kích thước, vị trí và nhu cầu để Thanh Phong tư vấn cấu hình, khảo sát và lập báo giá phù hợp.",
  ],
  [
    "/policies/privacy",
    "Thông tin và quyền riêng tư",
    "Cách website Thanh Phong tiếp nhận, sử dụng và bảo vệ thông tin yêu cầu tư vấn của khách hàng.",
  ],
] as const;

export function websiteSitemap(
  env: Environment,
  site: PublicSite,
): MetadataRoute.Sitemap {
  const origin = websiteOrigin(env);
  if (!origin || !canIndexWebsite(env)) return [];
  const paths = [
    ...publicPages.map(([path]) => path),
    ...site.products
      .filter((p) => p.status === "published")
      .map((p) => `/products/${encodeURIComponent(p.id)}`),
    ...site.articles
      .filter((p) => p.status === "published")
      .map((p) => `/news/${encodeURIComponent(p.slug)}`),
    ...site.projects
      .filter((p) => p.status === "published")
      .map((p) => `/projects/${encodeURIComponent(p.id)}`),
  ];
  return [...new Set(paths)].map((path) => ({
    url: new URL(path, origin).href,
  }));
}

export function websiteRobots(env: Environment): MetadataRoute.Robots {
  const origin = websiteOrigin(env);
  return canIndexWebsite(env) && origin
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: ["/admin", "/api/", "/.netlify/"],
        },
        sitemap: `${origin}/sitemap.xml`,
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}

export function businessSchema(env: Environment, settings: Settings) {
  const origin = websiteOrigin(env);
  if (!origin) return null;
  // Do not invent a street address, service area, opening hours or reviews.
  const realBusiness = !settings.isDemo && settings.address && settings.phone;
  return {
    "@context": "https://schema.org",
    "@type": realBusiness ? "HomeAndConstructionBusiness" : "Organization",
    "@id": `${origin}/#business`,
    name: settings.name,
    url: origin,
    description: settings.tagline,
    ...(!settings.isDemo && settings.phone
      ? { telephone: settings.phone }
      : {}),
    ...(!settings.isDemo && settings.email ? { email: settings.email } : {}),
    ...(realBusiness ? { address: settings.address } : {}),
  };
}

export function breadcrumbSchema(
  origin: string,
  items: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Trang chủ", path: "/" }, ...items].map(
      (item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: new URL(item.path, origin).href,
      }),
    ),
  };
}

export function serializeSchema(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}
