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
import type { FormProtection } from "@/domain/form-protection";

export interface SiteGateway {
  publicSite(): Promise<PublicSite>;
  adminState(): Promise<AdminState & { user: User }>;
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
  formProtection(): Promise<FormProtection>;
  addLead(
    lead: LeadInput,
    key: string,
    token?: string,
  ): Promise<{ code: string }>;
  logout(): Promise<{ ok: boolean }>;
}
export interface AuthGateway {
  login(input: LoginInput): Promise<{ user: User }>;
  changePassword(input: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ ok: boolean }>;
}
export interface SessionEvents {
  publish(): void;
  subscribe(listener: () => void): () => void;
}
export interface ChatGateway {
  embed(directChatUrl: string, frameOrigin?: string): { url: string };
}
export interface FormChallengeGateway {
  render(
    elementId: string,
    siteKey: string,
    onToken: (token: string) => void,
    onError: () => void,
  ): Promise<() => void>;
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
