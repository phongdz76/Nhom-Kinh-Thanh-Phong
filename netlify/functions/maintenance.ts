import { runMaintenance } from "../../src/backend/composition/maintenance";

export default async function maintenance() {
  // Netlify invokes scheduled functions internally, not through a public API route.
  if (process.env.CONTEXT && process.env.CONTEXT !== "production")
    return new Response(null, { status: 204 });
  try {
    const result = await runMaintenance();
    console.log("Scheduled maintenance:", result);
    return new Response(null, { status: 204 });
  } catch {
    // Provider/SQL errors may contain credentials or customer content.
    console.error(
      "Scheduled maintenance failed. Check notification status in admin.",
    );
    return new Response(null, { status: 500 });
  }
}

export const config = { schedule: "*/5 * * * *" };
