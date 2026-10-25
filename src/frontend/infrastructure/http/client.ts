export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function responseFor(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  if (
    options.body != null &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  )
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    ...options,
    headers,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
        ? body.error
        : "Chưa thể kết nối máy chủ.";
    throw new ApiError(message, response.status);
  }
  return response;
}
export async function requestJSON<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await responseFor(path, options);
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export async function requestBlob(path: string): Promise<Blob> {
  return (await responseFor(path)).blob();
}
export const jsonBody = (body: unknown, method = "POST"): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
