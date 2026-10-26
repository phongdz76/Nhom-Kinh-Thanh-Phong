import {
  categorySchema,
  leadSchema,
  leadUpdateSchema,
  postSchema,
  productSchema,
  projectSchema,
  settingsSchema,
} from "@/domain/schemas";
import type { Product, ProductInput } from "@/domain/models";
import type { SiteGateway } from "./ports";

export function createSiteService(gateway: SiteGateway) {
  return {
    ...gateway,
    saveProduct: (input: ProductInput | Product, id?: string) =>
      gateway.saveProduct(productSchema.parse(input), id),
    saveSettings: (input: Parameters<SiteGateway["saveSettings"]>[0]) =>
      gateway.saveSettings(settingsSchema.parse(input)),
    updateLead: (id: string, input: Parameters<SiteGateway["updateLead"]>[1]) =>
      gateway.updateLead(id, leadUpdateSchema.parse(input)),
    saveCategory: (input: Parameters<SiteGateway["saveCategory"]>[0]) =>
      gateway.saveCategory(categorySchema.parse(input)),
    saveContent: (
      kind: Parameters<SiteGateway["saveContent"]>[0],
      input: Parameters<SiteGateway["saveContent"]>[1],
    ) =>
      gateway.saveContent(
        kind,
        kind === "posts" ? postSchema.parse(input) : projectSchema.parse(input),
      ),
    addLead: (
      input: Parameters<SiteGateway["addLead"]>[0],
      key: string,
      token?: string,
    ) => gateway.addLead(leadSchema.parse(input), key, token),
  };
}
export type SiteService = ReturnType<typeof createSiteService>;
