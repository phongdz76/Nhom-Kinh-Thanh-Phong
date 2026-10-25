export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Chưa thể xử lý yêu cầu.";
export const errorStatus = (error: unknown): number | undefined =>
  error != null &&
  typeof error === "object" &&
  "status" in error &&
  typeof error.status === "number"
    ? error.status
    : undefined;
