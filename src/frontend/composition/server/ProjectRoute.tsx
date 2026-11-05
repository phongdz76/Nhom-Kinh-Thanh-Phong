import "server-only";
import { notFound } from "next/navigation";
import {
  findPublicContent,
  findPublicProduct,
} from "@/backend/composition/services";
import ProjectPage from "@/frontend/presentation/website/pages/ProjectPage";
import { canonicalOrigin, JsonLd, metadataForPage } from "./SeoRoutes";
import { breadcrumbSchema } from "@/frontend/infrastructure/seo/metadata";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findPublicContent("projects", slug);
  if (!project) notFound();
  return metadataForPage(
    `/projects/${encodeURIComponent(slug)}`,
    project.title,
    project.description,
    project.image,
  );
}
export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await findPublicContent("projects", slug);
  if (!project) notFound();
  const related = (
    await Promise.all(project.products.map((id) => findPublicProduct(id)))
  ).filter((product) => product !== null);
  const origin = canonicalOrigin();
  return (
    <>
      {origin && (
        <JsonLd
          data={breadcrumbSchema(origin, [
            { name: "Không gian ứng dụng", path: "/projects" },
            {
              name: project.title,
              path: `/projects/${encodeURIComponent(slug)}`,
            },
          ])}
        />
      )}
      <ProjectPage project={project} related={related} />
    </>
  );
}
