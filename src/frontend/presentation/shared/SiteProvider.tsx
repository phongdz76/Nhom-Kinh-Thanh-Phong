"use client";
import { createContext, useContext, type ReactNode } from "react";
import {
  useSiteState,
  type SiteInitialState,
  type SiteState,
} from "@/frontend/presentation/hooks/useSiteState";
import { sessionEvents, siteService } from "@/frontend/composition/services";
const SiteContext = createContext<SiteState | null>(null);
export type SiteProviderProps = SiteInitialState & { children: ReactNode };
export function SiteProvider({ children, ...initial }: SiteProviderProps) {
  const value = useSiteState(initial, siteService, sessionEvents);
  const identity = `${value.user?.id || "guest"}:${value.user?.role || ""}`;
  return (
    <SiteContext.Provider key={identity} value={value}>
      {children}
    </SiteContext.Provider>
  );
}
export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite requires SiteProvider.");
  return value;
}
