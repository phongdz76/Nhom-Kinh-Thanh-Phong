"use client";

import { useEffect, useId, useState } from "react";
import { formChallenge, siteService } from "@/frontend/composition/services";

export type FormVerificationState = { ready: boolean; token: string };

export default function FormVerification({
  onChange,
}: {
  onChange: (state: FormVerificationState) => void;
}) {
  const id = useId();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<
    "loading" | "ready" | "error" | "disabled"
  >("loading");
  useEffect(() => {
    let active = true;
    let remove: (() => void) | undefined;
    onChange({ ready: false, token: "" });
    function failed() {
      if (!active) return;
      onChange({ ready: false, token: "" });
      setStatus("error");
    }
    void (async () => {
      try {
        const policy = await siteService.formProtection();
        if (!active) return;
        if (!policy.ready) return failed();
        if (!policy.required) {
          onChange({ ready: true, token: "" });
          setStatus("disabled");
          return;
        }
        if (!policy.siteKey) return failed();
        remove = await formChallenge.render(
          id,
          policy.siteKey,
          (token) => {
            if (!active) return;
            onChange({ ready: !!token, token });
            setStatus(token ? "ready" : "loading");
          },
          failed,
        );
        if (!active) remove();
      } catch {
        failed();
      }
    })();
    return () => {
      active = false;
      remove?.();
    };
  }, [id, attempt, onChange]);

  return (
    <div className="form-verification" hidden={status === "disabled"}>
      <div id={id} />
      {status === "loading" && <p role="status">Đang chuẩn bị xác minh…</p>}
      {status === "error" && (
        <p className="form-error" role="alert">
          Chưa hoàn tất xác minh. Vui lòng{" "}
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setStatus("loading");
              setAttempt((value) => value + 1);
            }}
          >
            thử lại
          </button>{" "}
          hoặc liên hệ qua điện thoại.
        </p>
      )}
    </div>
  );
}
