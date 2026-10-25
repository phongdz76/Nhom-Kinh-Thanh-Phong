import type { User } from "@/domain/models";

// Application actors are authenticated and active; Payload access rules also
// require its collection discriminator and the active-account flag.
export const payloadActor = (user: User) => ({
  ...user,
  collection: "users" as const,
  isActive: true,
});
