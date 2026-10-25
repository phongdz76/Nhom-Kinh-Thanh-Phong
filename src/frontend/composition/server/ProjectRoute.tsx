import "server-only";
import { notFound } from "next/navigation";
import {
  findPublicContent,
  findPublicProduct,
} from "@/backend/composition/services";
import ProjectPage from "@/frontend/presentation/website/pages/ProjectPage";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return {
    title:
      (await findPublicContent("projects", slug))?.title ||
      "Không gian ứng dụng",
  };
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
  return <ProjectPage project={project} related={related} />;
}
