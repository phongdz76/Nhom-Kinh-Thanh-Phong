import type {
  AdminState,
  Article,
  Category,
  CategoryInput,
  ContentKind,
  EstimateExample,
  EstimateRecord,
  EstimateSummary,
  Lead,
  LeadEvent,
  LeadInput,
  LeadUpdate,
  LoginInput,
  Media,
  PostInput,
  Product,
  ProductInput,
  Project,
  ProjectInput,
  PublicSite,
  Settings,
  User,
} from "@/domain/models";
import type { Estimate } from "@/domain/estimates";

export interface SiteGateway {
  publicSite(): Promise<PublicSite>;
  adminState(): Promise<AdminState>;
  saveProduct(
    product: ProductInput,
    id?: string,
  ): Promise<{ product: Product }>;
  saveSettings(settings: Settings): Promise<{ settings: Settings }>;
  updateLead(id: string, changes: LeadUpdate): Promise<{ lead: Lead }>;
  leadDetails(id: string): Promise<{ lead: Lead; events: LeadEvent[] }>;
  uploadImage(file: File, alt: string): Promise<Media>;
  saveCategory(category: CategoryInput): Promise<{ category: Category }>;
  saveContent(
    kind: ContentKind,
    document: PostInput | ProjectInput,
  ): Promise<{ document: Article | Project }>;
  addLead(lead: LeadInput, key: string): Promise<{ code: string }>;
  logout(): Promise<{ ok: boolean }>;
}
export interface AuthGateway {
  login(input: LoginInput): Promise<{ user: User }>;
  changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ ok: boolean }>;
}
export interface ChatGateway {
  open(directChatUrl: string): Promise<void>;
  hide(): void;
}
export interface EstimateGateway {
  list(): Promise<{ estimates: EstimateSummary[]; totalDocs: number }>;
  get(id: string): Promise<EstimateRecord>;
  example(): Promise<EstimateExample>;
  save(
    document: Estimate,
    saved: { id: string; updatedAt: string } | null,
  ): Promise<EstimateRecord>;
  export(id: string, format: "xlsx" | "docx"): Promise<Blob>;
}
