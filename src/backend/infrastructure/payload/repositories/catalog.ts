import type { Article, Project } from "@/domain/models";
import { payloadActor } from "../actor";
import type { User } from "@/domain/models";
import type { CatalogRepository } from "@/backend/application/ports";
import { ApplicationError } from "@/backend/application/errors";
import "server-only";
import { cms } from "@/backend/infrastructure/payload/client";
import { hostedChatOrigin } from "@/backend/infrastructure/chat/config";
import {
  categoryDTO,
  productDTO,
  postDTO,
  projectDTO,
  settingsDTO,
  leadDTO,
} from "@/backend/infrastructure/payload/mappers";

async function publicSite() {
  const payload = await cms();
  const categories = await payload.find({
    collection: "categories",
    where: { isActive: { equals: true } },
    limit: 100,
    sort: "sortOrder",
    overrideAccess: false,
  });
  const ids = categories.docs.map((item) => item.id);
  const [products, posts, projects, settings] = await Promise.all([
    payload.find({
      collection: "products",
      where: {
        and: [{ _status: { equals: "published" } }, { category: { in: ids } }],
      },
      limit: 500,
      depth: 1,
      sort: "createdAt",
      overrideAccess: false,
    }),
    payload.find({
      collection: "posts",
      where: { _status: { equals: "published" } },
      limit: 100,
      sort: "-publishedAt",
      overrideAccess: false,
    }),
    payload.find({
      collection: "projects",
      where: { _status: { equals: "published" } },
      limit: 100,
      depth: 1,
      sort: "-publishedAt",
      overrideAccess: false,
    }),
    payload.findGlobal({ slug: "site-settings", overrideAccess: false }),
  ]);
  return {
    chatFrameOrigin: hostedChatOrigin(process.env) || undefined,
    categories: categories.docs.map(categoryDTO),
    products: products.docs.map(productDTO),
    articles: posts.docs.map(postDTO),
    projects: projects.docs.map(projectDTO),
    settings: settingsDTO(settings),
  };
}
async function findPublicProduct(id: string) {
  const payload = await cms();
  const result = await payload.find({
    collection: "products",
    where: {
      and: [{ publicId: { equals: id } }, { _status: { equals: "published" } }],
    },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  });
  const product = result.docs[0];
  if (
    !product ||
    typeof product.category !== "object" ||
    !product.category.isActive
  )
    return null;
  return productDTO(product);
}
function findPublicContent(
  kind: "posts",
  slug: string,
): Promise<Article | null>;
function findPublicContent(
  kind: "projects",
  slug: string,
): Promise<Project | null>;
async function findPublicContent(kind: "posts" | "projects", slug: string) {
  const payload = await cms();
  const document = (
    await payload.find({
      collection: kind,
      where: {
        and: [{ slug: { equals: slug } }, { _status: { equals: "published" } }],
      },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    })
  ).docs[0];
  if (!document) return null;
  return kind === "posts" ? postDTO(document) : projectDTO(document);
}
async function adminState(user: User) {
  const payload = await cms();
  const options = { user: payloadActor(user), overrideAccess: false as const };
  const [products, categories, posts, projects, settings, leads, media] =
    await Promise.all([
      payload.find({
        collection: "products",
        limit: 500,
        depth: 1,
        sort: "-createdAt",
        ...options,
      }),
      payload.find({
        collection: "categories",
        limit: 100,
        sort: "sortOrder",
        ...options,
      }),
      payload.find({
        collection: "posts",
        limit: 100,
        sort: "-updatedAt",
        ...options,
      }),
      payload.find({
        collection: "projects",
        limit: 100,
        depth: 1,
        sort: "-updatedAt",
        ...options,
      }),
      payload.findGlobal({ slug: "site-settings", ...options }),
      user.role === "owner"
        ? payload.find({
            collection: "leads",
            limit: 200,
            sort: "-createdAt",
            depth: 0,
            ...options,
          })
        : Promise.resolve({ docs: [], totalDocs: 0 }),
      payload.find({
        collection: "media",
        limit: 200,
        sort: "-createdAt",
        depth: 0,
        ...options,
      }),
    ]);
  return {
    chatFrameOrigin: hostedChatOrigin(process.env) || undefined,
    products: products.docs.map(productDTO),
    categories: categories.docs.map(categoryDTO),
    articles: posts.docs.map(postDTO),
    projects: projects.docs.map(projectDTO),
    settings: settingsDTO(settings),
    leads: leads.docs.map(leadDTO),
    leadTotal: leads.totalDocs,
    media: media.docs.map((item) => ({
      id: String(item.id),
      url: `/api/media/${item.id}`,
      alt: item.alt,
      filename: item.filename,
    })),
    notificationConfigured: Boolean(
      process.env.SMTP_HOST && process.env.LEAD_NOTIFICATION_EMAIL,
    ),
  };
}

export const catalogRepository: CatalogRepository = {
  publicSite,
  findPublicProduct,
  findPublicContent,
  adminState,
  async category(key) {
    const payload = await cms();
    const doc = (
      await payload.find({
        collection: "categories",
        where: { key: { equals: key } },
        limit: 1,
      })
    ).docs[0];
    return doc ? categoryDTO(doc) : null;
  },
  async product(id, user) {
    const payload = await cms();
    const doc = (
      await payload.find({
        collection: "products",
        where: { publicId: { equals: id } },
        limit: 1,
        depth: 1,
        user: payloadActor(user),
        overrideAccess: false,
      })
    ).docs[0];
    return doc ? productDTO(doc) : null;
  },
  async saveProduct(values, user, id) {
    const payload = await cms();
    const category = await this.category(values.category);
    if (!category)
      throw new ApplicationError("invalid", "Danh mục chưa hoạt động.");
    const { id: ignoredId, status, images, updatedAt, ...fields } = values;
    const data = {
      ...fields,
      category: category.dbId,
      _status: status,
      images: images.map((url) => ({ url })),
    };
    let document;
    if (id) {
      const existing = (
        await payload.find({
          collection: "products",
          where: { publicId: { equals: id } },
          limit: 1,
          user: payloadActor(user),
          overrideAccess: false,
        })
      ).docs[0];
      if (!existing)
        throw new ApplicationError("notFound", "Không tìm thấy sản phẩm.");
      document = await payload.update({
        collection: "products",
        id: existing.id,
        data,
        depth: 1,
        user: payloadActor(user),
        overrideAccess: false,
      });
    } else
      document = await payload.create({
        collection: "products",
        data: { ...data, publicId: `p-${crypto.randomUUID()}` },
        depth: 1,
        user: payloadActor(user),
        overrideAccess: false,
      });
    return productDTO(document);
  },
  async saveCategory(data, user) {
    const payload = await cms();
    const current = (
      await payload.find({
        collection: "categories",
        where: { key: { equals: data.key } },
        limit: 1,
        user: payloadActor(user),
        overrideAccess: false,
      })
    ).docs[0];
    const doc = current
      ? await payload.update({
          collection: "categories",
          id: current.id,
          data,
          user: payloadActor(user),
          overrideAccess: false,
        })
      : await payload.create({
          collection: "categories",
          data,
          user: payloadActor(user),
          overrideAccess: false,
        });
    return { category: categoryDTO(doc), created: !current };
  },
  async saveSettings(data, user) {
    const payload = await cms();
    return settingsDTO(
      await payload.updateGlobal({
        slug: "site-settings",
        data,
        user: payloadActor(user),
        overrideAccess: false,
      }),
    );
  },
  async saveContent(values, user) {
    const payload = await cms();
    const { status, ...fields } = values.document;
    const data: Record<string, unknown> = { ...fields, _status: status };
    if (values.kind === "projects") {
      data.images = values.document.images.map((url) => ({ url }));
      const ids = values.document.products.length
        ? (
            await payload.find({
              collection: "products",
              where: { publicId: { in: values.document.products } },
              limit: 20,
            })
          ).docs
        : [];
      if (ids.length !== values.document.products.length)
        throw new ApplicationError(
          "invalid",
          "Danh sách sản phẩm liên quan không hợp lệ.",
        );
      data.products = ids.map((item) => item.id);
    }
    const existing = (
      await payload.find({
        collection: values.kind,
        where: { slug: { equals: values.document.slug } },
        limit: 1,
        user: payloadActor(user),
        overrideAccess: false,
      })
    ).docs[0];
    const doc = existing
      ? await payload.update({
          collection: values.kind,
          id: existing.id,
          data,
          user: payloadActor(user),
          overrideAccess: false,
        })
      : await payload.create({
          collection: values.kind,
          data,
          user: payloadActor(user),
          overrideAccess: false,
        });
    return {
      document: values.kind === "posts" ? postDTO(doc) : projectDTO(doc),
      created: !existing,
    };
  },
};
