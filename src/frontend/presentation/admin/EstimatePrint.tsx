"use client";
import type { Estimate } from "@/domain/estimates";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import EstimateSheet from "@/frontend/presentation/admin/EstimateSheet";

export default function EstimatePrint({
  document: estimate,
}: {
  document: Estimate;
}) {
  const paper = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const element = paper.current;
    if (!element) return;
    const measure = () => setScale(Math.min(1, 1044 / element.scrollHeight));
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener("beforeprint", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("beforeprint", measure);
    };
  }, []);
  return (
    <div className="estimate-print-root">
      <div className="estimate-print-toolbar">
        <Link href="/admin?tab=estimates" className="button button-outline">
          Về báo giá
        </Link>
        <p>
          A4 dọc · Tỷ lệ 100% · Tắt đầu trang / chân trang của trình duyệt
          {scale < 0.8 ? " · Bảng dài đang được thu nhỏ để vừa một trang." : ""}
        </p>
        <button
          type="button"
          className="button button-primary"
          onClick={() => window.print()}
        >
          In / Lưu PDF
        </button>
      </div>
      <div className="estimate-print-page">
        <div
          className="estimate-print-fit"
          style={{ "--estimate-print-scale": scale } as React.CSSProperties}
        >
          <EstimateSheet document={estimate} paperRef={paper} />
        </div>
      </div>
    </div>
  );
}
