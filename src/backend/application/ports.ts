import type { z } from "zod";
import type {
  categorySchema,
  leadSchema,
  leadUpdateSchema,
  postSchema,
  productSchema,
  projectSchema,
} from "@/domain/schemas";
import type {
  AdminState,
  Article,
  Category,
  Lead,
  LeadEvent,
  Media,
  Product,
  Project,
  PublicSite,
  Settings,
  User,
  EstimateSummary,
} from "@/domain/models";
import type { Estimate } from "@/domain/estimates";

export type ProductValues = z.output<typeof productSchema>;
export type LeadValues = z.output<typeof leadSchema>;
export type LeadChanges = z.output<typeof leadUpdateSchema>;
export type ContentValues =
  | { kind: "posts"; document: z.output<typeof postSchema> }
  | { kind: "projects"; document: z.output<typeof projectSchema> };
export interface CatalogRepository {
  publicSite(): Promise<PublicSite>;
  findPublicProduct(id: string): Promise<Product | null>;
  findPublicContent(kind: "posts", slug: string): Promise<Article | null>;
  findPublicContent(kind: "projects", slug: string): Promise<Project | null>;
  adminState(user: User): Promise<AdminState>;
  category(key: string): Promise<Category | null>;
  product(id: string, user: User): Promise<Product | null>;
  saveProduct(values: ProductValues, user: User, id?: string): Promise<Product>;
  saveCategory(
    values: z.output<typeof categorySchema>,
    user: User,
  ): Promise<{ category: Category; created: boolean }>;
  saveSettings(values: Settings, user: User): Promise<Settings>;
  saveContent(
    values: ContentValues,
    user: User,
  ): Promise<{ document: Article | Project; created: boolean }>;
}
export type StoredEstimate = {
  id: string;
  updatedAt: string;
  document: unknown;
};
export interface EstimateRepository {
  list(
    user: User,
  ): Promise<{ estimates: EstimateSummary[]; totalDocs: number }>;
  get(id: string, user: User): Promise<StoredEstimate>;
  findByCode(code: string, user: User): Promise<{ id: string }[]>;
  save(
    document: Estimate,
    total: number,
    user: User,
    id?: string,
  ): Promise<StoredEstimate>;
}
export type LeadCreation = Omit<
  LeadValues,
  "contactAcknowledged" | "website"
> & {
  code: string;
  idempotencyKey: string;
  requestHash: string;
  productName: string;
  consentAt: string;
  status: "new";
  notificationState: "pending" | "not_configured";
};
export interface LeadRepository {
  findByKey(key: string): Promise<{ code: string; requestHash: string } | null>;
  createWithEventAndNotification(
    values: LeadCreation,
  ): Promise<{ code: string }>;
  updateWithEvent(id: string, changes: LeadChanges, user: User): Promise<Lead>;
  details(id: string, user: User): Promise<{ lead: Lead; events: LeadEvent[] }>;
  list(
    user: User,
    page: number,
    limit: number,
  ): Promise<{
    leads: Lead[];
    page?: number;
    totalDocs: number;
    hasNextPage: boolean;
  }>;
}
export interface RateLimiter {
  check(
    scope: string,
    identifier: string,
    maximum: number,
    seconds: number,
  ): Promise<void>;
}
export interface AuthRepository {
  session(headers: Headers): Promise<User | null>;
  login(
    email: string,
    password: string,
  ): Promise<{ token: string; user: User }>;
  changePassword(
    user: User,
    currentPassword: string,
    newPassword: string,
  ): Promise<void>;
  logout(headers: Headers, user: User | null): Promise<void>;
}
export interface MediaRepository {
  upload(file: File, alt: string, user: User): Promise<Media>;
  get(
    id: string,
  ): Promise<{ data: Uint8Array; mimeType: string } | { redirect: string }>;
}
