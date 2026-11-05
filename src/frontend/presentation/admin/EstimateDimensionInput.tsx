"use client";
import { useState } from "react";
import { formatMetres, parseMetres } from "@/domain/measurements";

export default function EstimateDimensionInput({
  value,
  label,
  onChange,
}: {
  value: number;
  label: string;
  onChange: (millimetres: number) => void;
}) {
  const [entry, setEntry] = useState<string | null>(null);
  return (
    <label>
      {label}
      <input
        type="text"
        inputMode="decimal"
        required
        maxLength={24}
        aria-label={label}
        placeholder="2,34 hoặc 2m34"
        value={entry ?? formatMetres(value)}
        onChange={(event) => {
          const text = event.target.value;
          const mm = parseMetres(text);
          setEntry(text);
          event.target.setCustomValidity(
            mm === null
              ? "Nhập kích thước lớn hơn 0 đến 20 m, tối đa 3 số lẻ. Ví dụ: 2m34 hoặc 0,456."
              : "",
          );
          onChange(mm ?? 0);
        }}
        onBlur={(event) => {
          if (parseMetres(event.target.value) !== null) setEntry(null);
        }}
      />
    </label>
  );
}
