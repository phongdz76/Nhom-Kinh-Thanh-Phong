import { dispatchApi } from "./router";

export async function handleApi(
  request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  return dispatchApi(request, path);
}
