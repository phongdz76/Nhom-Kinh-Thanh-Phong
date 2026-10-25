import { requireUser } from "@/backend/interfaces/http/auth";
import {
  getEstimate,
  listEstimates,
  saveEstimate,
} from "@/backend/composition/services";
import {
  HttpError,
  endpoint,
  json,
  readJSON,
  sameOrigin,
} from "@/backend/interfaces/http/response";
import {
  estimateExample as sample,
  exportEstimateExcel,
  exportEstimateWord,
} from "@/backend/composition/documents";

export const getEstimates = endpoint(async (request) => {
  const user = await requireUser(request, true);
  return json(await listEstimates(user));
});
export const createEstimate = endpoint(async (request) => {
  sameOrigin(request);
  const user = await requireUser(request, true);
  return json(await saveEstimate(await readJSON(request, 65536), user), 201);
});

export const getExample = endpoint(async (request) => {
  await requireUser(request, true);
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  return json({
    ...sample,
    document: {
      ...sample.document,
      date,
      code: `BG-MAU-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    },
  });
});

export const getEstimateDetails = endpoint(async (request, context) => {
  const user = await requireUser(request, true);
  return json(await getEstimate((await context.params).id, user));
});
export const patchEstimate = endpoint(async (request, context) => {
  sameOrigin(request);
  const user = await requireUser(request, true);
  return json(
    await saveEstimate(
      await readJSON(request, 65536),
      user,
      (await context.params).id,
    ),
  );
});

export const downloadEstimate = endpoint(async (request, context) => {
  const user = await requireUser(request, true);
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "xlsx" && format !== "docx")
    throw new HttpError(400, "Chọn định dạng Excel hoặc Word.");
  const { document } = await getEstimate((await context.params).id, user);
  const data =
    format === "xlsx"
      ? await exportEstimateExcel(document)
      : await exportEstimateWord(document);
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type":
        format === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${document.code}.${format}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
