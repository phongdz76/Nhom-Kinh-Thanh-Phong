"use client";
import { authService } from "@/frontend/composition/services";
import { errorMessage } from "@/domain/errors";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BrandLink from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
import PasswordInput from "@/frontend/presentation/shared/PasswordInput";
export default function AdminLogin() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="login-page">
      <div className="login-card">
        <BrandLink aria-label="Về trang chủ" />
        <span className="eyebrow">KHÔNG GIAN QUẢN TRỊ</span>
        <h1>Chào mừng trở lại.</h1>
        <p>Đăng nhập để quản lý nội dung và yêu cầu tư vấn.</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy) return;
            setBusy(true);
            setError("");
            const form = new FormData(event.currentTarget);
            const data = {
              email: String(form.get("email")),
              password: String(form.get("password")),
            };
            try {
              await authService.login(data);
              router.replace("/admin");
              router.refresh();
            } catch (error) {
              setError(errorMessage(error));
              setBusy(false);
            }
          }}
        >
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={150}
            />
          </label>
          <PasswordInput
            label="Mật khẩu"
            name="password"
            autoComplete="current-password"
            required
            maxLength={200}
          />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="button button-primary" disabled={busy}>
            {busy ? "Đang đăng nhập..." : "Đăng nhập"}
            <Icon name="arrow" size={18} />
          </button>
        </form>
        <p className="login-help">
          Tài khoản do chủ cơ sở khởi tạo. Không có đăng ký công khai.
        </p>
      </div>
    </main>
  );
}
