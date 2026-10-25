import "server-only";
import { publicSite } from "@/backend/composition/services";
import { session } from "@/backend/interfaces/http/auth";
import RootDocument from "@/frontend/presentation/shared/RootDocument";
export { metadata } from "@/frontend/presentation/shared/RootDocument";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialData, initialUser] = await Promise.all([
    publicSite(),
    session(),
  ]);
  return (
    <RootDocument initialData={initialData} initialUser={initialUser}>
      {children}
    </RootDocument>
  );
}
