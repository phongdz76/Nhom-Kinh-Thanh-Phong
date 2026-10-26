import type { z } from "zod";
import type {
  categorySchema,
  leadSchema,
  leadUpdateSchema,
  loginSchema,
  postSchema,
  productSchema,
  projectSchema,
  settingsSchema,
} from "./schemas";
import type { Estimate, calculateEstimate } from "./estimates";

export type ID = string;
export type ProductInput = z.input<typeof productSchema>;
export type CategoryInput = z.input<typeof categorySchema>;
export type Settings = z.output<typeof settingsSchema>;
export type LeadInput = z.input<typeof leadSchema>;
export type LeadUpdate = z.input<typeof leadUpdateSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type PostInput = z.input<typeof postSchema>;
export type ProjectInput = z.input<typeof projectSchema>;
export type ContentKind = "posts" | "projects";
export type Product = Omit<z.output<typeof productSchema>, "id" | "opening"> & {
  id: ID;
  opening: string;
};
export type Category = {
  id: ID;
  dbId?: ID;
  name: string;
  icon: CategoryInput["icon"];
  isActive: boolean;
  sortOrder: number;
};
export type Article = z.output<typeof postSchema> & { id: ID };
export type Project = Omit<z.output<typeof projectSchema>, "slug"> & {
  id: ID;
  dbId?: ID;
};
export type User = {
  id: ID;
  name: string;
  email: string;
  role: "owner" | "editor";
};
export type Lead = Pick<
  Required<LeadInput>,
  "name" | "phone" | "email" | "location" | "message" | "productId" | "type"
> & {
  id: ID;
  code: string;
  productName: string;
  status: LeadUpdate["status"];
  note: string;
  createdAt: string;
  updatedAt: string;
  notificationState: string;
};
export type LeadEvent = {
  event: string;
  fromStatus?: Lead["status"];
  toStatus?: Lead["status"];
  note?: string;
  createdAt: string;
};
export type Media = { id: ID; url: string; alt: string; filename?: string };
export type PublicSite = {
  chatFrameOrigin?: string;
  products: Product[];
  categories: Category[];
  articles: Article[];
  projects: Project[];
  settings: Settings;
};
export type AdminState = PublicSite & {
  leads: Lead[];
  media: Media[];
  leadTotal: number;
  notificationConfigured: boolean;
};
export type EstimateRecord = {
  id: ID;
  updatedAt: string;
  document: Estimate;
  calculation: ReturnType<typeof calculateEstimate>;
};
export type EstimateSummary = {
  id: ID;
  code: string;
  customerName: string;
  projectAddress: string;
  total: number;
  updatedAt: string;
};
export type EstimateExample = {
  document: Estimate;
  originalTotal: number;
  audit: {
    index: number;
    sourceRow: number;
    originalVolume: number;
    originalAmount: number;
  }[];
};
export type MutationResult<T> =
  ({ ok: true } & T) | { ok: false; error: string; status?: number };
