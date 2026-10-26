import { z } from "zod";
const line = (maximum: number) => z.string().trim().max(maximum);
const asset = z
  .string()
  .regex(
    /^(\/images\/[a-zA-Z0-9_-]+\.(jpg|png|webp)|\/api\/media\/[a-f0-9-]{36})$/,
    "Ảnh phải được tải lên thư viện của website.",
  );
const slug = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Đường dẫn chỉ dùng chữ thường không dấu, số và dấu gạch ngang.",
  )
  .max(120);
export const loginSchema = z
  .object({ email: z.email().max(150), password: z.string().min(1).max(200) })
  .strict();
export const tawkChatLinkSchema = z
  .string()
  .trim()
  .max(250)
  .regex(
    /^https:\/\/tawk\.to\/chat\/[a-f0-9]{24}\/[a-zA-Z0-9]+\/?(?:\?layout=modern)?$/,
    "Dán Direct Chat Link từ tawk.to, dạng https://tawk.to/chat/PropertyID/WidgetID.",
  )
  // Layout belongs to the hosted direct-chat page, not the embedded SDK.
  // Keep only the validated widget identity when storing or embedding a link.
  .transform((value) => value.split("?")[0]);
export const productSchema = z
  .object({
    id: line(80).optional(),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{1,30}$/),
    name: line(150).min(3),
    category: slug,
    summary: line(2000).min(1),
    subtitle: line(150).default(""),
    opening: z.enum([
      "Mở quay",
      "Mở lùa",
      "Mở hất",
      "Xếp trượt",
      "Cố định",
      "Vách cố định",
    ]),
    color: line(80).default(""),
    tag: line(80).default(""),
    image: asset,
    images: z.array(asset).min(1).max(12),
    status: z.enum(["draft", "published"]),
    featured: z.boolean(),
    updatedAt: z.string().optional(),
  })
  .strict();
export const settingsSchema = z
  .object({
    name: line(100).min(2),
    tagline: line(200),
    phone: z
      .string()
      .trim()
      .refine(
        (v) => !v || /^[+0-9 .()-]{9,18}$/.test(v),
        "Số điện thoại không hợp lệ.",
      ),
    email: z.union([z.literal(""), z.email().max(150)]),
    zalo: z.union([
      z.literal(""),
      z.string().regex(/^https:\/\/zalo\.me\/[a-zA-Z0-9_+.-]+$/),
    ]),
    zaloQr: z
      .union([z.literal(""), z.literal("/images/zalo-contact-qr.svg"), asset])
      .default(""),
    tawkDirectChatUrl: z.union([z.literal(""), tawkChatLinkSchema]).default(""),
    address: line(400),
    mapUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (value) =>
          !value ||
          /^https:\/\/(?:maps\.app\.goo\.gl\/[a-zA-Z0-9]+|(?:www\.|maps\.)?google\.com\/maps(?:[/?].*)?)$/.test(
            value,
          ),
        "Dán liên kết vị trí từ Google Maps.",
      )
      .default(""),
    mapEmbedUrl: z
      .string()
      .trim()
      .max(4000)
      .refine(
        (value) =>
          !value || /^https:\/\/www\.google\.com\/maps\/embed\?pb=/.test(value),
        "Dán URL src trong mã nhúng Google Maps.",
      )
      .default(""),
    hours: line(150),
    isDemo: z.boolean().optional(),
  })
  .strict();
export const leadSchema = z
  .object({
    name: line(100).min(2),
    phone: line(18)
      .transform((v) => v.replace(/[\s.()-]/g, ""))
      .refine(
        (v) => /^(0[35789]\d{8}|\+84[35789]\d{8})$/.test(v),
        "Số điện thoại Việt Nam không hợp lệ.",
      ),
    email: z.union([z.literal(""), z.email().max(150)]).default(""),
    location: line(200).default(""),
    message: line(2000).default(""),
    productId: line(80).default(""),
    type: z.enum(["quotation", "survey", "consultation"]),
    source: z
      .string()
      .regex(/^\/(?!\/)[a-zA-Z0-9/_?=&%.-]*$/)
      .max(400),
    contactAcknowledged: z.literal(true, {
      error: "Vui lòng đồng ý cho cơ sở liên hệ theo yêu cầu.",
    }),
    privacyVersion: z.literal("2026-10-v1"),
    website: z.string().max(0).default(""),
  })
  .strict();
export const leadUpdateSchema = z
  .object({
    status: z.enum(["new", "contacted", "survey", "quoted", "won", "lost"]),
    note: line(2000).default(""),
  })
  .strict();
export const categorySchema = z
  .object({
    key: slug,
    name: line(100).min(2),
    icon: z.enum(["door", "window", "layers", "railing", "roof", "grid"]),
    isActive: z.boolean(),
    sortOrder: z.number().int().min(0).max(10000),
  })
  .strict();
export const postSchema = z
  .object({
    slug,
    title: line(180).min(3),
    category: line(100).min(1),
    image: asset,
    intro: line(1000).min(1),
    time: line(40).default(""),
    sections: z
      .array(
        z
          .object({ title: line(180).min(1), text: line(10000).min(1) })
          .strict(),
      )
      .min(1)
      .max(30),
    status: z.enum(["draft", "published"]),
  })
  .strict();
export const projectSchema = z
  .object({
    slug,
    title: line(180).min(3),
    type: line(100).min(1),
    category: z.enum(["villa", "house", "interior", "other"]),
    description: line(3000).min(1),
    image: asset,
    images: z.array(asset).max(12).default([]),
    products: z.array(line(80)).max(20).default([]),
    status: z.enum(["draft", "published"]),
  })
  .strict();
