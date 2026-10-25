import * as auth from "./controllers/auth";
import * as publicController from "./controllers/public";
import * as catalog from "./controllers/catalog";
import * as leads from "./controllers/leads";
import * as estimates from "./controllers/estimates";
import * as media from "./controllers/media";
import * as health from "./controllers/health";
import { createRouter } from "./routing";

export const dispatchApi = createRouter([
  { path: "admin/categories", methods: { POST: catalog.upsertCategory } },
  { path: "admin/content/:kind", methods: { POST: catalog.upsertContent } },
  {
    path: "admin/estimates/:id/export",
    methods: { GET: estimates.downloadEstimate },
  },
  {
    path: "admin/estimates/:id",
    methods: {
      GET: estimates.getEstimateDetails,
      PATCH: estimates.patchEstimate,
    },
  },
  {
    path: "admin/estimates/example",
    methods: { GET: estimates.getExample },
  },
  {
    path: "admin/estimates",
    methods: { GET: estimates.getEstimates, POST: estimates.createEstimate },
  },
  {
    path: "admin/leads/:id",
    methods: { PATCH: leads.patchLead, GET: leads.getLeadDetails },
  },
  { path: "admin/leads", methods: { GET: leads.getLeads } },
  { path: "admin/media", methods: { POST: media.uploadMedia } },
  { path: "admin/products/:id", methods: { PATCH: catalog.updateProduct } },
  { path: "admin/products", methods: { POST: catalog.createProduct } },
  { path: "admin/settings", methods: { PATCH: catalog.updateSettings } },
  { path: "admin/state", methods: { GET: catalog.getState } },
  { path: "auth/login", methods: { POST: auth.login } },
  { path: "auth/logout", methods: { POST: auth.logoutSession } },
  { path: "auth/password", methods: { POST: auth.changePassword } },
  { path: "auth/session", methods: { GET: auth.getSession } },
  { path: "health", methods: { GET: health.getHealth } },
  { path: "media/:id", methods: { GET: media.getMedia } },
  { path: "public/leads", methods: { POST: leads.submitLead } },
  {
    path: "public/products/:id",
    methods: { GET: publicController.getProduct },
  },
  { path: "public/products", methods: { GET: publicController.listProducts } },
  { path: "public/site", methods: { GET: publicController.getSite } },
]);
