"use client";
import { authService } from "@/frontend/composition/services";
import { errorMessage } from "@/domain/errors";
import { useState } from "react";
import Icon from "@/frontend/presentation/shared/Icon";
import PasswordInput from "@/frontend/presentation/shared/PasswordInput";
export default function PasswordForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="admin-panel settings-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        const form = new FormData(event.currentTarget);
        const values = {
          currentPassword: String(form.get("currentPassword")),
          newPassword: String(form.get("newPassword")),
        };
        try {
          await authService.changePassword(values);
          // A full navigation clears authenticated client state after revocation.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign("/admin/login");
        } catch (error) {
          setError(errorMessage(error));
          setBusy(false);
        }
      }}
    >
      <div className="panel-heading">
        <div>
          <h2>Đổi mật khẩu quản trị</h2>
          <p>Sau khi đổi, tất cả phiên đăng nhập sẽ kết thúc.</p>
        </div>
      </div>
      <div className="form-grid">
        <PasswordInput
          label="Mật khẩu hiện tại"
          name="currentPassword"
          autoComplete="current-password"
          required
          maxLength={200}
        />
        <PasswordInput
          label="Mật khẩu mới"
          name="newPassword"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={200}
        />
        <p className="full-width field-help">
          Mật khẩu mới cần ít nhất 12 ký tự.
        </p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="button button-primary" disabled={busy}>
        {busy ? "Đang đổi..." : "Đổi mật khẩu"}
        <Icon name="shield" size={16} />
      </button>
    </form>
  );
}
