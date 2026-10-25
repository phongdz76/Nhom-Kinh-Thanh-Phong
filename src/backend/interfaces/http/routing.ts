export type RequestHandler = (
  request: Request,
  context: { params: Promise<Record<string, string>> },
) => Promise<Response>;

type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";
export type RouteDefinition = {
  path: string;
  methods: Partial<Record<Method, RequestHandler>>;
};

// Specific paths precede parameterized paths, so "estimates/example" cannot
// be treated as an estimate ID. Splitting happens before parameter decoding.
export function createRouter(definitions: readonly RouteDefinition[]) {
  const routes = definitions
    .map((definition) => ({
      ...definition,
      segments: definition.path.split("/"),
    }))
    .sort(
      (left, right) =>
        left.segments.filter((segment) => segment.startsWith(":")).length -
        right.segments.filter((segment) => segment.startsWith(":")).length,
    );
  return async (request: Request, segments: readonly string[]) => {
    for (const route of routes) {
      if (route.segments.length !== segments.length) continue;
      const params: Record<string, string> = {};
      if (
        !route.segments.every((segment, index) => {
          if (segment.startsWith(":")) {
            params[segment.slice(1)] = segments[index];
            return true;
          }
          return segment === segments[index];
        })
      )
        continue;

      const allow = Object.keys(route.methods);
      if (route.methods.GET && !route.methods.HEAD) allow.push("HEAD");
      if (!route.methods.OPTIONS) allow.push("OPTIONS");
      const method = request.method.toUpperCase() as Method;
      if (method === "OPTIONS" && !route.methods.OPTIONS)
        return new Response(null, {
          status: 204,
          headers: { Allow: allow.join(", ") },
        });
      const handler =
        route.methods[method] ??
        (method === "HEAD" ? route.methods.GET : undefined);
      if (!handler)
        return new Response(null, {
          status: 405,
          headers: { Allow: allow.join(", ") },
        });
      const response = await handler(request, {
        params: Promise.resolve(params),
      });
      if (method === "HEAD")
        return new Response(null, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
      return response;
    }
    return Response.json(
      { error: "Không tìm thấy API." },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  };
}
