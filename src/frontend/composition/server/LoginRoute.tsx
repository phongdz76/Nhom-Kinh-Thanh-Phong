import "server-only";
import { redirect } from "next/navigation";
import { session } from "@/backend/interfaces/http/auth";
import AdminLogin from "@/frontend/presentation/admin/AdminLogin";
export const metadata = {
  title: "Đăng nhập quản trị",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await session()) redirect("/admin");
  return <AdminLogin />;
}
