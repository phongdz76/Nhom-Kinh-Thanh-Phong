import {
  createLead,
  leadDetails,
  listLeads,
  updateLead,
} from "@/backend/composition/services";
import {
  endpoint,
  json,
  readJSON,
  sameOrigin,
} from "@/backend/interfaces/http/response";
import { requireUser } from "@/backend/interfaces/http/auth";

export const submitLead = endpoint(async (request) => {
  sameOrigin(request);
  const result = await createLead(
    await readJSON(request),
    request.headers.get("idempotency-key"),
  );
  return json(
    { code: result.code, status: "received" },
    result.repeated ? 200 : 201,
  );
});

export const getLeads = endpoint(async (request) => {
  const user = await requireUser(request, true);
  const params = new URL(request.url).searchParams;
  return json(
    await listLeads(
      user,
      Number(params.get("page") || 1),
      Number(params.get("limit") || 50),
    ),
  );
});

export const patchLead = endpoint(async (request, context) => {
  sameOrigin(request);
  const user = await requireUser(request, true);
  return json({
    lead: await updateLead(
      (await context.params).id,
      await readJSON(request),
      user,
    ),
  });
});
export const getLeadDetails = endpoint(async (request, context) => {
  const user = await requireUser(request, true);
  return json(await leadDetails((await context.params).id, user));
});
