"use client";
import { useId, useState } from "react";
import Icon from "@/frontend/presentation/shared/Icon";

export default function PasswordInput({
  label,
  id,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-input">
        <input {...props} id={inputId} type={visible ? "text" : "password"} />
        <button
          type="button"
          className="password-toggle"
          aria-label={`${visible ? "Ẩn" : "Hiện"} ${label.toLowerCase()}`}
          aria-controls={inputId}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          <Icon name={visible ? "eyeOff" : "eye"} size={19} />
        </button>
      </div>
    </div>
  );
}
