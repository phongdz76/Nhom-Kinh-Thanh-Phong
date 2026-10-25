import "server-only";
import { errorStatus } from "@/domain/errors";
import { ApplicationError } from "@/backend/application/errors";
import { notFound, redirect } from "next/navigation";
import { session } from "@/backend/interfaces/http/auth";
import { getEstimate } from "@/backend/composition/services";
import EstimatePrint from "@/frontend/presentation/admin/EstimatePrint";
export const metadata = {
  title: "Bản in báo giá",
  robots: { index: false, follow: false },
};
export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await session();
  if (!user) redirect("/admin/login");
  if (user.role !== "owner") notFound();
  let record;
  try {
    record = await getEstimate((await params).id, user);
  } catch (error) {
    if (
      (error instanceof ApplicationError && error.code === "notFound") ||
      errorStatus(error) === 404
    )
      notFound();
    throw error;
  }
  return <EstimatePrint document={record.document} />;
}
