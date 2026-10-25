"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AdminState,
  Category,
  CategoryInput,
  ContentKind,
  LeadInput,
  LeadUpdate,
  MutationResult,
  PostInput,
  Product,
  ProductInput,
  ProjectInput,
  PublicSite,
  Settings,
  User,
} from "@/domain/models";
import { errorMessage, errorStatus } from "@/domain/errors";
import type { SiteService } from "@/frontend/application/site";
export type SiteInitialState = {
  initialData: PublicSite;
  initialUser: User | null;
};
export function useSiteState(
  { initialData, initialUser }: SiteInitialState,
  gateway: SiteService,
) {
  const [data, setData] = useState<AdminState>({
    ...initialData,
    leads: [],
    media: [],
    leadTotal: 0,
    notificationConfigured: false,
  });
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(Boolean(initialUser));
  const [storageError, setError] = useState("");
  const router = useRouter();
  useEffect(() => {
    setUser(initialUser);
    setLoading(Boolean(initialUser));
  }, [initialUser]);
  const refresh = useCallback(async () => {
    try {
      const result: Partial<AdminState> & PublicSite = await (user
        ? gateway.adminState()
        : gateway.publicSite());
      setData((current) => ({
        ...current,
        ...result,
        leads: result.leads ?? [],
      }));
      setError("");
    } catch (error) {
      setError(errorMessage(error));
      if (errorStatus(error) === 401) {
        setUser(null);
        setData((current) => ({ ...current, leads: [] }));
        router.replace("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  }, [user, router, gateway]);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [refresh]);
  async function mutate<T>(
    operation: () => Promise<T>,
  ): Promise<MutationResult<T>> {
    try {
      const result = await operation();
      setError("");
      return { ...result, ok: true };
    } catch (error) {
      setError(errorMessage(error));
      if (errorStatus(error) === 401) router.replace("/admin/login");
      return {
        ok: false,
        error: errorMessage(error),
        status: errorStatus(error),
      };
    }
  }
  async function saveProduct(product: ProductInput | Product) {
    const exists = data.products.some((item) => item.id === product.id);
    const result = await mutate(() =>
      gateway.saveProduct(product, exists ? product.id : undefined),
    );
    if (result.ok)
      setData((current) => ({
        ...current,
        products: exists
          ? current.products.map((item) =>
              item.id === result.product.id ? result.product : item,
            )
          : [result.product, ...current.products],
      }));
    return result;
  }
  async function saveSettings(settings: Settings) {
    const result = await mutate(() => gateway.saveSettings(settings));
    if (result.ok)
      setData((current) => ({ ...current, settings: result.settings }));
    return result;
  }
  async function updateLead(id: string, changes: LeadUpdate) {
    const result = await mutate(() => gateway.updateLead(id, changes));
    if (result.ok)
      setData((current) => ({
        ...current,
        leads: current.leads.map((item) =>
          item.id === id ? result.lead : item,
        ),
      }));
    return result;
  }
  async function uploadImage(file: File, alt: string) {
    const result = await mutate(() => gateway.uploadImage(file, alt));
    if (result.ok)
      setData((current) => ({
        ...current,
        media: [...(current.media || []), result],
      }));
    return result;
  }
  async function saveCategory(category: CategoryInput) {
    const result = await mutate(() => gateway.saveCategory(category));
    if (result.ok) await refresh();
    return result;
  }
  async function saveContent(
    kind: ContentKind,
    document: PostInput | ProjectInput,
  ) {
    const result = await mutate(() => gateway.saveContent(kind, document));
    if (result.ok) await refresh();
    return result;
  }
  async function logout() {
    const result = await mutate(() => gateway.logout());
    if (result.ok) {
      setUser(null);
      setData({
        ...initialData,
        leads: [],
        media: [],
        leadTotal: 0,
        notificationConfigured: false,
      });
      router.replace("/admin/login");
      router.refresh();
    }
    return result;
  }
  const all: Category = {
    sortOrder: -1,
    id: "all",
    name: "Tất cả sản phẩm",
    icon: "grid",
    isActive: true,
  };
  const publicCategories = [
    all,
    ...data.categories.filter((item) => item.isActive),
  ];
  const publicProducts = data.products.filter(
    (item) =>
      item.status === "published" &&
      publicCategories.some((category) => category.id === item.category),
  );
  const getLeadDetails = useCallback(
    (id: string) => gateway.leadDetails(id),
    [gateway],
  );
  return {
    ...data,
    user,
    loading,
    storageError,
    refresh,
    saveProduct,
    saveSettings,
    updateLead,
    uploadImage,
    saveCategory,
    saveContent,
    logout,
    getLeadDetails,
    categories: [all, ...data.categories],
    publicCategories,
    publishedProducts: publicProducts,
    publicArticles: data.articles.filter((item) => item.status === "published"),
    publicProjects: data.projects.filter((item) => item.status === "published"),
    addLead: (lead: LeadInput, key: string) =>
      mutate(() => gateway.addLead(lead, key)),
  };
}
export type SiteState = ReturnType<typeof useSiteState>;
