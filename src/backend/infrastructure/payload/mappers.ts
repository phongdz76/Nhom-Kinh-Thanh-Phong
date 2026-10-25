import { z } from "zod";
import type {
  Article,
  Category,
  Lead,
  Product,
  Project,
  Settings,
  User,
} from "@/domain/models";

// Explicit projections keep CMS metadata and credentials outside API contracts.
const record = (value: unknown) =>
  z.record(z.string(), z.unknown()).parse(value);
const text = (value: unknown) => (typeof value === "string" ? value : "");
const list = (value: unknown) =>
  Array.isArray(value) ? value.map(record) : [];
const publicationStatus = z.enum(["draft", "published"]);
const categoryIcon = z.enum([
  "door",
  "window",
  "layers",
  "railing",
  "roof",
  "grid",
]);
const leadStatus = z.enum([
  "new",
  "contacted",
  "survey",
  "quoted",
  "won",
  "lost",
]);

export function categoryDTO(value: unknown): Category {
  const doc = record(value);
  return {
    id: text(doc.key),
    dbId: String(doc.id),
    name: text(doc.name),
    icon: categoryIcon.parse(doc.icon),
    isActive: Boolean(doc.isActive),
    sortOrder: Number(doc.sortOrder ?? 0),
  };
}
export function productDTO(value: unknown): Product {
  const doc = record(value);
  const category =
    doc.category && typeof doc.category === "object"
      ? record(doc.category)
      : null;
  return {
    id: text(doc.publicId),
    code: text(doc.code),
    name: text(doc.name),
    category: text(category?.key),
    image: text(doc.image),
    images: list(doc.images).map((item) => text(item.url)),
    summary: text(doc.summary),
    subtitle: text(doc.subtitle),
    opening: text(doc.opening),
    color: text(doc.color),
    tag: text(doc.tag),
    featured: Boolean(doc.featured),
    status: publicationStatus.parse(doc._status),
    updatedAt: text(doc.updatedAt),
  };
}
export function projectDTO(value: unknown): Project {
  const doc = record(value);
  return {
    id: text(doc.slug),
    dbId: String(doc.id),
    title: text(doc.title),
    type: text(doc.type),
    category: z
      .enum(["villa", "house", "interior", "other"])
      .parse(doc.category),
    description: text(doc.description),
    image: text(doc.image),
    images: list(doc.images).map((item) => text(item.url)),
    products: (Array.isArray(doc.products) ? doc.products : [])
      .filter((item) => item && typeof item === "object")
      .map(record)
      .filter((item) => item._status === "published")
      .map((item) => text(item.publicId)),
    status: publicationStatus.parse(doc._status),
  };
}
export function postDTO(value: unknown): Article {
  const doc = record(value);
  return {
    id: String(doc.id),
    slug: text(doc.slug),
    title: text(doc.title),
    category: text(doc.category),
    image: text(doc.image),
    intro: text(doc.intro),
    time: text(doc.time),
    sections: list(doc.sections).map((item) => ({
      title: text(item.title),
      text: text(item.text),
    })),
    status: publicationStatus.parse(doc._status),
  };
}
export function settingsDTO(value: unknown): Settings {
  const doc = record(value);
  return {
    name: text(doc.name) || "Thanh Phong",
    tagline: text(doc.tagline),
    phone: text(doc.phone),
    email: text(doc.email),
    zalo: text(doc.zalo),
    zaloQr: text(doc.zaloQr),
    tawkDirectChatUrl: text(doc.tawkDirectChatUrl),
    address: text(doc.address),
    mapUrl: text(doc.mapUrl),
    mapEmbedUrl: text(doc.mapEmbedUrl),
    hours: text(doc.hours),
    isDemo: Boolean(doc.isDemo),
  };
}
export function leadDTO(value: unknown): Lead {
  const doc = record(value);
  return {
    id: String(doc.id),
    code: text(doc.code),
    name: text(doc.name),
    phone: text(doc.phone),
    email: text(doc.email),
    location: text(doc.location),
    message: text(doc.message),
    productId: text(doc.productId),
    productName: text(doc.productName),
    type: z.enum(["quotation", "survey", "consultation"]).parse(doc.type),
    status: leadStatus.parse(doc.status),
    note: text(doc.note),
    createdAt: text(doc.createdAt),
    updatedAt: text(doc.updatedAt),
    notificationState: text(doc.notificationState),
  };
}
export function userDTO(value: unknown): User {
  const doc = record(value);
  return {
    id: String(doc.id),
    name: text(doc.name),
    email: text(doc.email),
    role: z.enum(["owner", "editor"]).parse(doc.role),
  };
}
export const estimateSummaryDTO = z.object({
  id: z.string(),
  code: z.string(),
  customerName: z.string(),
  projectAddress: z.string(),
  total: z.number(),
  updatedAt: z.string(),
});
export const storedEstimateDTO = z.object({
  id: z.string(),
  updatedAt: z.string(),
  document: z.unknown(),
});
