import "server-only";
import AdminDashboard from "@/frontend/presentation/admin/AdminDashboard";
import { redirect } from "next/navigation";
import { session } from "@/backend/interfaces/http/auth";
export const metadata = {
  title: "Quản trị — Bản xem trước",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  if (!(await session())) redirect("/admin/login");
  return <AdminDashboard />;
}
