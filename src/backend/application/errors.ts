export type ErrorCode =
  | "invalid"
  | "unauthenticated"
  | "forbidden"
  | "notFound"
  | "conflict"
  | "tooManyRequests"
  | "unavailable";
export class ApplicationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}
