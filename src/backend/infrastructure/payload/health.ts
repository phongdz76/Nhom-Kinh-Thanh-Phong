import { cms } from "./client";
export async function checkHealth() {
  await (
    await cms()
  ).find({
    collection: "categories",
    limit: 1,
    depth: 0,
    overrideAccess: false,
  });
}
