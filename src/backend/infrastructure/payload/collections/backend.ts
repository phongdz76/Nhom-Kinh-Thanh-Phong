import path from "node:path";
import type { Access, CollectionConfig, Field, GlobalConfig } from "payload";

const owner: Access = ({ req }) =>
  Boolean(req.user?.isActive && req.user?.role === "owner");
const editor: Access = ({ req }) =>
  Boolean(req.user?.isActive && ["owner", "editor"].includes(req.user?.role));
const published: Access = ({ req }) =>
  editor({ req } as Parameters<Access>[0]) || {
    _status: { equals: "published" },
  };
const text = (
  name: string,
  required = false,
  extra: Record<string, unknown> = {},
): Field => ({ name, type: "text", required, ...extra }) as Field;
const imageFields: Field[] = [
  text("image"),
  { name: "images", type: "array", fields: [text("url", true)] },
];
const contentAccess = {
  read: published,
  create: editor,
  update: editor,
  delete: owner,
};
const statusFields: Field[] = [
  {
    name: "_status",
    type: "select",
    options: ["draft", "published"],
    defaultValue: "draft",
    required: true,
  },
  { name: "publishedAt", type: "date" },
];
const stamp: CollectionConfig["hooks"] = {
  beforeChange: [
    ({ data }) => {
      if (data._status === "published" && !data.publishedAt)
        data.publishedAt = new Date().toISOString();
      return data;
    },
  ],
};

export const collections: CollectionConfig[] = [
  {
    slug: "users",
    auth: {
      tokenExpiration: 28800,
      useSessions: true,
      maxLoginAttempts: 5,
      lockTime: 900000,
      cookies: {
        sameSite: "Lax",
        secure:
          process.env.NODE_ENV === "production" &&
          process.env.SERVER_URL?.startsWith("https://"),
      },
    },
    access: { read: owner, create: owner, update: owner, delete: () => false },
    fields: [
      text("name", true),
      {
        name: "role",
        type: "select",
        options: ["owner", "editor"],
        required: true,
        defaultValue: "editor",
        access: {
          create: ({ req }) => req.user?.role === "owner",
          update: ({ req }) => req.user?.role === "owner",
        },
      },
      { name: "isActive", type: "checkbox", defaultValue: true },
    ],
  },
  {
    slug: "categories",
    access: {
      read: () => true,
      create: owner,
      update: owner,
      delete: () => false,
    },
    fields: [
      text("key", true, { unique: true }),
      text("name", true),
      text("icon", true),
      { name: "sortOrder", type: "number", defaultValue: 0 },
      { name: "isActive", type: "checkbox", defaultValue: true },
    ],
  },
  {
    slug: "products",
    access: contentAccess,
    versions: { maxPerDoc: 20 },
    hooks: stamp,
    fields: [
      text("publicId", true, { unique: true }),
      text("code", true, { unique: true }),
      text("name", true),
      {
        name: "category",
        type: "relationship",
        relationTo: "categories",
        required: true,
        index: true,
      },
      text("summary", true),
      text("subtitle"),
      text("opening"),
      text("color"),
      text("tag"),
      ...imageFields,
      { name: "featured", type: "checkbox", defaultValue: false },
      ...statusFields,
    ],
  },
  {
    slug: "media",
    access: {
      read: () => true,
      create: editor,
      update: editor,
      delete: () => false,
    },
    upload: {
      staticDir: path.resolve(process.env.MEDIA_DIR || "./var/media"),
      mimeTypes: ["image/webp"],
      disableLocalStorage: Boolean(process.env.R2_BUCKET),
    },
    fields: [text("alt", true)],
  },
  {
    slug: "projects",
    access: contentAccess,
    versions: { maxPerDoc: 20 },
    hooks: stamp,
    fields: [
      text("slug", true, { unique: true }),
      text("title", true),
      text("type", true),
      text("category", true),
      text("description", true),
      ...imageFields,
      {
        name: "products",
        type: "relationship",
        relationTo: "products",
        hasMany: true,
      },
      ...statusFields,
    ],
  },
  {
    slug: "posts",
    access: contentAccess,
    versions: { maxPerDoc: 20 },
    hooks: stamp,
    fields: [
      text("slug", true, { unique: true }),
      text("title", true),
      text("category", true),
      text("image", true),
      text("intro", true),
      text("time"),
      {
        name: "sections",
        type: "array",
        required: true,
        fields: [
          text("title", true),
          { name: "text", type: "textarea", required: true },
        ],
      },
      ...statusFields,
    ],
  },
  {
    slug: "leads",
    access: {
      read: owner,
      create: () => false,
      update: owner,
      delete: () => false,
    },
    fields: [
      text("code", true, { unique: true }),
      text("idempotencyKey", true, { unique: true }),
      text("requestHash", true),
      text("name", true),
      text("phone", true, { index: true }),
      text("email"),
      text("location"),
      { name: "message", type: "textarea" },
      text("productId"),
      text("productName"),
      text("type", true),
      text("source"),
      text("privacyVersion", true),
      { name: "consentAt", type: "date", required: true },
      {
        name: "status",
        type: "select",
        options: ["new", "contacted", "survey", "quoted", "won", "lost"],
        defaultValue: "new",
        required: true,
        index: true,
      },
      { name: "note", type: "textarea" },
      {
        name: "notificationState",
        type: "select",
        options: ["pending", "sent", "failed", "not_configured"],
        defaultValue: "pending",
      },
      { name: "notifiedAt", type: "date" },
    ],
  },
  {
    slug: "lead-events",
    access: {
      read: owner,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    fields: [
      {
        name: "lead",
        type: "relationship",
        relationTo: "leads",
        required: true,
        index: true,
      },
      text("event", true),
      text("fromStatus"),
      text("toStatus"),
      { name: "note", type: "textarea" },
      { name: "actor", type: "relationship", relationTo: "users" },
    ],
  },
  {
    slug: "rate-limits",
    dbName: "rate_limits",
    access: {
      read: () => false,
      create: () => false,
      update: () => false,
      delete: () => false,
    },
    fields: [
      text("key", true, { unique: true }),
      { name: "count", type: "number", required: true },
      { name: "resetAt", type: "date", required: true, index: true },
    ],
  },
  {
    slug: "estimates",
    access: { read: owner, create: owner, update: owner, delete: owner },
    fields: [
      text("code", true, { unique: true }),
      text("customerName", true),
      text("projectAddress"),
      { name: "total", type: "number", required: true },
      { name: "document", type: "json", required: true },
    ],
  },
];

export const siteSettings: GlobalConfig = {
  slug: "site-settings",
  access: { read: () => true, update: owner },
  fields: [
    text("name", true),
    text("tagline"),
    text("phone"),
    text("zalo"),
    text("zaloQr"),
    text("tawkDirectChatUrl"),
    text("email"),
    { name: "address", type: "textarea" },
    text("mapUrl"),
    { name: "mapEmbedUrl", type: "textarea" },
    text("hours"),
    { name: "isDemo", type: "checkbox", defaultValue: false },
  ],
};
