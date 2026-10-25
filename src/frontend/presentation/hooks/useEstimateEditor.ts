"use client";
import { useCallback, useEffect, useState } from "react";
import {
  calculateEstimate,
  type Estimate,
  type EstimateLine,
} from "@/domain/estimates";
import type {
  EstimateExample,
  EstimateSummary,
  Settings,
  User,
} from "@/domain/models";
import { errorMessage } from "@/domain/errors";
import type { EstimateGateway } from "@/frontend/application/ports";
export const newLine = (): EstimateLine => ({
  id: crypto.randomUUID(),
  description: "",
  unit: "m2",
  measurement: "dimensions",
  width: 0,
  height: 0,
  quantity: 1,
  volume: 0,
  unitPrice: 0,
  agreedAmount: null,
});
function blank(settings: Settings, user: User | null): Estimate {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
  return {
    code: `BG-${date.replaceAll("-", "")}-${crypto.randomUUID().slice(0, 5).toUpperCase()}`,
    date,
    title: "BẢNG BÁO GIÁ NHÔM KÍNH",
    companyName: settings.name || "Nhôm kính Thanh Phong",
    companyAddress: settings.address || "",
    companyPhone: settings.phone || "",
    customerName: "",
    projectAddress: "",
    signatory: user?.name || "",
    notes: "",
    payments: [30, 50, 20],
    lines: [newLine()],
  };
}
export function useEstimateEditor(
  settings: Settings,
  user: User | null,
  gateway: EstimateGateway,
) {
  const [draft, setDraft] = useState(() => blank(settings, user));
  const [saved, setSaved] = useState<{ id: string; updatedAt: string } | null>(
    null,
  );
  const [savedContent, setSavedContent] = useState("");
  const [records, setRecords] = useState<EstimateSummary[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [source, setSource] = useState<EstimateExample | null>(null);
  const calculation = calculateEstimate(draft);
  const dirty = savedContent && savedContent !== JSON.stringify(draft);
  const refreshList = useCallback(async () => {
    const result = await gateway.list();
    setRecords(result.estimates);
    setTotalRecords(result.totalDocs);
  }, [gateway]);
  useEffect(() => {
    refreshList().catch((err) => setError(errorMessage(err)));
  }, [refreshList]);
  function change<K extends keyof Estimate>(key: K, value: Estimate[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setMessage("");
  }
  function changeLine(id: string, changes: Partial<EstimateLine>) {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line) =>
        line.id === id ? { ...line, ...changes } : line,
      ),
    }));
    setMessage("");
  }
  function reset() {
    setDraft(blank(settings, user));
    setSaved(null);
    setSavedContent("");
    setSource(null);
    setError("");
    setMessage("");
  }
  async function saveDocument() {
    const record = await gateway.save(draft, saved);
    setSaved({ id: record.id, updatedAt: record.updatedAt });
    setDraft(record.document);
    setSavedContent(JSON.stringify(record.document));
    await refreshList();
    return record;
  }
  async function perform(action: "save" | "print" | "xlsx" | "docx") {
    if (busy) return;
    let printWindow;
    if (action === "print") printWindow = window.open("about:blank", "_blank");
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const record = await saveDocument();
      if (action === "print") {
        if (printWindow) {
          printWindow.opener = null;
          printWindow.location.href = `/admin/estimates/${record.id}/print`;
        } else {
          // A full document navigation initializes the standalone print layout.
          // eslint-disable-next-line @next/next/no-location-assign-relative-destination
          window.location.assign(`/admin/estimates/${record.id}/print`);
        }
      } else if (action === "xlsx" || action === "docx") {
        const url = URL.createObjectURL(
          await gateway.export(record.id, action),
        );
        const anchor = window.document.createElement("a");
        anchor.href = url;
        anchor.download = `${record.document.code}.${action}`;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setMessage(
        action === "save"
          ? "Đã lưu báo giá trên máy chủ."
          : "Đã lưu báo giá và chuẩn bị bản xuất.",
      );
    } catch (err) {
      printWindow?.close();
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function loadExample() {
    setBusy(true);
    setError("");
    try {
      const result = await gateway.example();
      setDraft(result.document);
      setSource(result);
      setSaved(null);
      setSavedContent("");
      setMessage(
        "Đã nạp dữ liệu file mẫu. Thành tiền đang được tính lại tự động.",
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function openRecord(id: string) {
    setBusy(true);
    setError("");
    try {
      const result = await gateway.get(id);
      setDraft(result.document);
      setSaved({ id: result.id, updatedAt: result.updatedAt });
      setSavedContent(JSON.stringify(result.document));
      setSource(null);
      setMessage("Đã mở báo giá đã lưu.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return {
    draft,
    setDraft,
    saved,
    records,
    totalRecords,
    busy,
    error,
    message,
    preview,
    setPreview,
    source,
    calculation,
    dirty,
    change,
    changeLine,
    reset,
    perform,
    loadExample,
    openRecord,
  };
}
