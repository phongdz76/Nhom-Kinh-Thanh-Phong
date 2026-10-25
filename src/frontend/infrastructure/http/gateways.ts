import type {
  AuthGateway,
  EstimateGateway,
  SiteGateway,
} from "@/frontend/application/ports";
import { API_PATHS as paths } from "./api-paths";
import { jsonBody, requestBlob, requestJSON } from "./client";

export const siteApi: SiteGateway = {
  publicSite: () => requestJSON(paths.public.site),
  adminState: () => requestJSON(paths.admin.state),
  saveProduct: (product, id) =>
    requestJSON(
      id ? paths.admin.product(id) : paths.admin.products,
      jsonBody(product, id ? "PATCH" : "POST"),
    ),
  saveSettings: (settings) =>
    requestJSON(paths.admin.settings, jsonBody(settings, "PATCH")),
  updateLead: (id, changes) =>
    requestJSON(paths.admin.lead(id), jsonBody(changes, "PATCH")),
  leadDetails: (id) => requestJSON(paths.admin.lead(id)),
  uploadImage: (file, alt) => {
    const body = new FormData();
    body.append("file", file);
    body.append("alt", alt);
    return requestJSON(paths.admin.media, { method: "POST", body });
  },
  saveCategory: (category) =>
    requestJSON(paths.admin.categories, jsonBody(category)),
  saveContent: (kind, document) =>
    requestJSON(paths.admin.content(kind), jsonBody(document)),
  addLead: (lead, key) =>
    requestJSON(paths.public.leads, {
      ...jsonBody(lead),
      headers: { "Idempotency-Key": key },
    }),
  logout: () => requestJSON(paths.auth.logout, jsonBody({})),
};
export const authApi: AuthGateway = {
  login: (input) => requestJSON(paths.auth.login, jsonBody(input)),
  changePassword: (input) => requestJSON(paths.auth.password, jsonBody(input)),
};
export const estimateApi: EstimateGateway = {
  list: () => requestJSON(paths.admin.estimates),
  get: (id) => requestJSON(paths.admin.estimate(id)),
  example: () => requestJSON(paths.admin.estimateExample),
  save: (document, saved) =>
    requestJSON(
      saved ? paths.admin.estimate(saved.id) : paths.admin.estimates,
      jsonBody(
        { document, updatedAt: saved?.updatedAt },
        saved ? "PATCH" : "POST",
      ),
    ),
  export: (id, format) => requestBlob(paths.admin.estimateExport(id, format)),
};
