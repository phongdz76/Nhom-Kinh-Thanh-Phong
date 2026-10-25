import { checkHealth } from "@/backend/composition/services";
import { endpoint, json } from "@/backend/interfaces/http/response";

export const getHealth = endpoint(async () => {
  await checkHealth();
  return json({ status: "ok" });
});
