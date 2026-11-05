import "server-only";
import { session } from "@/backend/interfaces/http/auth";
import RootDocument from "@/frontend/presentation/shared/RootDocument";
import { metadata as baseMetadata } from "@/frontend/presentation/shared/RootDocument";
import {
  websiteData,
  JsonLd,
  organizationSchema,
  canonicalOrigin,
  seoEnvironment,
} from "./SeoRoutes";
import { canIndexWebsite } from "@/frontend/infrastructure/seo/metadata";
export function generateMetadata() {
  const origin = canonicalOrigin();
  const index = canIndexWebsite(seoEnvironment());
  return {
    ...baseMetadata,
    ...(origin ? { metadataBase: new URL(origin) } : {}),
    robots: { index, follow: index },
  };
}
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialData, initialUser] = await Promise.all([
    websiteData(),
    session(),
  ]);
  return (
    <RootDocument initialData={initialData} initialUser={initialUser}>
      <JsonLd data={organizationSchema(initialData.settings)} />
      {children}
    </RootDocument>
  );
}
