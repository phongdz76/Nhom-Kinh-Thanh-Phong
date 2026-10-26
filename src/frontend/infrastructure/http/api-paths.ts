const segment = (value: string) => encodeURIComponent(value);
export const API_PATHS = {
  auth: {
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    password: "/api/auth/password",
    session: "/api/auth/session",
  },
  public: {
    chatFrame: (link: string) =>
      `/api/public/chat-frame?link=${encodeURIComponent(link)}`,
    site: "/api/public/site",
    leads: "/api/public/leads",
    formProtection: "/api/public/form-protection",
    products: "/api/public/products",
    product: (id: string) => `/api/public/products/${segment(id)}`,
  },
  admin: {
    state: "/api/admin/state",
    products: "/api/admin/products",
    product: (id: string) => `/api/admin/products/${segment(id)}`,
    settings: "/api/admin/settings",
    categories: "/api/admin/categories",
    media: "/api/admin/media",
    leads: "/api/admin/leads",
    lead: (id: string) => `/api/admin/leads/${segment(id)}`,
    content: (kind: "posts" | "projects") => `/api/admin/content/${kind}`,
    estimates: "/api/admin/estimates",
    estimate: (id: string) => `/api/admin/estimates/${segment(id)}`,
    estimateExample: "/api/admin/estimates/example",
    estimateExport: (id: string, format: "xlsx" | "docx") =>
      `/api/admin/estimates/${segment(id)}/export?format=${format}`,
  },
} as const;
