import { requireUser } from "@/backend/interfaces/http/auth";
import {
  adminState,
  saveCategory,
  saveContent,
  saveProduct,
  saveSettings,
} from "@/backend/composition/services";
import {
  endpoint,
  json,
  readJSON,
  sameOrigin,
} from "@/backend/interfaces/http/response";

export const getState = endpoint(async (request) => {
  const user = await requireUser(request);
  return json({ ...(await adminState(user)), user });
});

export const updateSettings = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request, true);
  return json({ settings: await saveSettings(await readJSON(request), user) });
});

export const upsertCategory = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request, true);
  const result = await saveCategory(await readJSON(request), user);
  return json({ category: result.category }, result.created ? 201 : 200);
});

export const upsertContent = endpoint(async (request, context) => {
  sameOrigin(request);
  const user = await requireUser(request);
  const { kind } = await context.params;
  const result = await saveContent(
    kind,
    await readJSON(request, kind === "posts" ? 350000 : 64000),
    user,
  );
  return json({ document: result.document }, result.created ? 201 : 200);
});

export const createProduct = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request);
  return json(
    { product: await saveProduct(await readJSON(request), user) },
    201,
  );
});

export const updateProduct = endpoint(async (request, context) => {
  sameOrigin(request);
  const user = await requireUser(request);
  const { id } = await context.params;
  return json({
    product: await saveProduct(await readJSON(request), user, id),
  });
});
