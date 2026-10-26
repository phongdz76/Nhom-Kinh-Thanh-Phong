"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
import type { SessionEvents } from "@/frontend/application/ports";
export type SiteInitialState = {
  initialData: PublicSite;
  initialUser: User | null;
};
function publicState(site: PublicSite): AdminState {
  return {
    ...site,
    leads: [],
    media: [],
    leadTotal: 0,
    notificationConfigured: false,
  };
}
export function useSiteState(
  { initialData, initialUser }: SiteInitialState,
  gateway: SiteService,
  sessionEvents: SessionEvents,
) {
  const [data, setData] = useState(() => publicState(initialData));
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(Boolean(initialUser));
  const [storageError, setError] = useState("");
  const epoch = useRef(0);
  const latestRefresh = useRef(0);
  const leaving = useRef(false);
  const revoking = useRef(false);
  const invalidate = useCallback(() => {
    epoch.current++;
    latestRefresh.current++;
    leaving.current = true;
    setUser(null);
    setData(publicState(initialData));
    setLoading(false);
  }, [initialData]);
  const refresh = useCallback(async () => {
    if (leaving.current || revoking.current) return;
    const version = epoch.current;
    const request = ++latestRefresh.current;
    const current = () =>
      version === epoch.current && request === latestRefresh.current;
    try {
      if (user) {
        const { user: authenticated, ...result } = await gateway.adminState();
        if (!current()) return;
        if (authenticated.id !== user.id || authenticated.role !== user.role) {
          invalidate();
          window.location.reload();
          return;
        }
        // Replace the entire snapshot. Merging can retain private fields that
        // the next account is no longer permitted to receive.
        setData(result);
      } else {
        const result = await gateway.publicSite();
        if (!current()) return;
        setData(publicState(result));
      }
      setError("");
    } catch (error) {
      if (!current()) return;
      setError(errorMessage(error));
      if (errorStatus(error) === 401) {
        invalidate();
        if (window.location.pathname.startsWith("/admin"))
          window.location.replace("/admin/login");
      }
    } finally {
      if (current()) setLoading(false);
    }
  }, [user, gateway, invalidate]);
  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);
  useEffect(() => {
    window.addEventListener("focus", refresh);
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted && user) {
        invalidate();
        window.location.reload();
      }
    };
    window.addEventListener("pageshow", restored);
    const timer = user
      ? window.setInterval(() => {
          if (document.visibilityState === "visible") void refresh();
        }, 60000)
      : undefined;
    const unsubscribe = sessionEvents.subscribe(() => {
      invalidate();
      window.location.reload();
    });
    return () => {
      // These counters intentionally advance on cleanup to invalidate pending
      // requests; they are lifecycle tokens, not DOM node references.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      epoch.current++;
      // eslint-disable-next-line react-hooks/exhaustive-deps
      latestRefresh.current++;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", restored);
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [refresh, user, sessionEvents, invalidate]);
  async function mutate<T>(
    operation: () => Promise<T>,
  ): Promise<MutationResult<T>> {
    const version = epoch.current;
    if (leaving.current)
      return { ok: false, error: "Phiên đăng nhập đã thay đổi.", status: 401 };
    try {
      const result = await operation();
      if (version !== epoch.current)
        return {
          ok: false,
          error: "Phiên đăng nhập đã thay đổi.",
          status: 401,
        };
      setError("");
      return { ...result, ok: true };
    } catch (error) {
      if (version !== epoch.current)
        return {
          ok: false,
          error: "Phiên đăng nhập đã thay đổi.",
          status: 401,
        };
      setError(errorMessage(error));
      if (errorStatus(error) === 401) {
        invalidate();
        if (window.location.pathname.startsWith("/admin"))
          window.location.replace("/admin/login");
      }
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
    if (revoking.current) return;
    revoking.current = true;
    // Discard every pending response before starting server-side revocation.
    epoch.current++;
    latestRefresh.current++;
    setLoading(true);
    const result = await mutate(() => gateway.logout());
    if (result.ok) {
      invalidate();
      sessionEvents.publish();
      window.location.replace("/admin/login");
    } else {
      revoking.current = false;
      setLoading(false);
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
    addLead: (lead: LeadInput, key: string, token?: string) =>
      mutate(() => gateway.addLead(lead, key, token)),
  };
}
export type SiteState = ReturnType<typeof useSiteState>;
