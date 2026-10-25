"use client";
import { createContext, useContext, type ReactNode } from "react";
import {
  useSiteState,
  type SiteInitialState,
  type SiteState,
} from "@/frontend/presentation/hooks/useSiteState";
import { siteService } from "@/frontend/composition/services";
const SiteContext = createContext<SiteState | null>(null);
export type SiteProviderProps = SiteInitialState & { children: ReactNode };
export function SiteProvider({ children, ...initial }: SiteProviderProps) {
  const value = useSiteState(initial, siteService);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}
export function useSite() {
  const value = useContext(SiteContext);
  if (!value) throw new Error("useSite requires SiteProvider.");
  return value;
}
