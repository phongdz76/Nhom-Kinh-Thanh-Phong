"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { openExcelTable } from "@/frontend/composition/services";
import type {
  ExcelTableSession,
  TableView,
} from "@/frontend/application/excel-table";
import { errorMessage } from "@/domain/errors";

export default function ExcelTableEditor() {
  const [session, setSession] = useState<ExcelTableSession | null>(null);
  const committed = useRef(new Map<string, string>());
  const [fileName, setFileName] = useState("");
  const [sheetId, setSheetId] = useState(0);
  const [range, setRange] = useState("");
  const [table, setTable] = useState<TableView | null>(null);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [formulasStale, setFormulasStale] = useState(false);
  const [error, setError] = useState("");
  const [invalidCells, setInvalidCells] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function showTable(id: number, selection: string, source = session) {
    try {
      const view = source!.view(id, selection);
      setTable(view);
      setRange(view.range);
      setError("");
      setRevision((v) => v + 1);
    } catch (err) {
      setTable(null);
      setError(errorMessage(err));
    }
  }
  async function load(file: File) {
    if (
      dirty &&
      !window.confirm("Bảng đang sửa chưa được tải xuống. Thay bằng file khác?")
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (!/\.xlsx$/i.test(file.name))
        throw new Error(
          "Chọn file .xlsx. Với file .xls, hãy lưu thành .xlsx trong Excel trước.",
        );
      if (file.size > 5 * 1024 * 1024)
        throw new Error("File Excel tối đa 5 MB.");
      const opened = await openExcelTable(await file.arrayBuffer());
      setSession(opened);
      committed.current.clear();
      setFileName(file.name);
      setSheetId(opened.sheets[0].id);
      setRange(opened.sheets[0].range);
      setDirty(false);
      setFormulasStale(false);
      setInvalidCells({});
      showTable(opened.sheets[0].id, opened.sheets[0].range, opened);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!session || Object.keys(invalidCells).length) return;
    setBusy(true);
    setError("");
    try {
      const bytes = await session.export();
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }),
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName.replace(/\.xlsx$/i, "")}-da-chinh.xlsx`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDirty(false);
      setMessage(
        "Đã chuẩn bị file Excel. Mở bằng Excel để tính lại công thức và kiểm tra trước khi gửi khách.",
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  const hasInvalid = Object.keys(invalidCells).length > 0;
  return (
    <section
      className="admin-panel excel-table-editor"
      aria-label="Chỉnh bảng Excel của khách"
    >
      <h2>Nhập & sửa bảng Excel của khách</h2>
      <p>
        Chọn file .xlsx, sheet và vùng bảng (ví dụ A1:I30) để sửa nội dung. Giữ
        ô gộp, độ rộng cột, màu và định dạng khi xuất lại. File được xử lý ngay
        trên trình duyệt.
      </p>
      <p className="field-help">
        Công thức được giữ nguyên và tính lại khi mở trong Excel. Ô công thức và
        ngày tháng chỉ xem. Chức năng này sửa bảng riêng, không tự chuyển sang
        mẫu báo giá ở trên; không chỉnh biểu đồ, macro hay hình vẽ.
      </p>
      <fieldset disabled={busy}>
        <label>
          File Excel của khách (.xlsx, tối đa 5 MB)
          <input
            type="file"
            accept=".xlsx"
            aria-label="File Excel của khách"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void load(file);
            }}
          />
        </label>
        {session && (
          <>
            <p>
              <strong>{fileName}</strong>
              {dirty ? " · Có thay đổi chưa tải xuống" : ""}
            </p>
            <div className="excel-table-controls">
              <label>
                Sheet
                <select
                  aria-label="Sheet Excel"
                  value={sheetId}
                  disabled={hasInvalid}
                  onChange={(event) => {
                    const id = Number(event.target.value);
                    const selection = session.sheets.find(
                      (s) => s.id === id,
                    )!.range;
                    setSheetId(id);
                    setRange(selection);
                    showTable(id, selection);
                  }}
                >
                  {session.sheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Vùng bảng
                <input
                  aria-label="Vùng bảng Excel"
                  value={range}
                  maxLength={30}
                  placeholder="A1:I30"
                  disabled={hasInvalid}
                  onChange={(event) => setRange(event.target.value)}
                />
              </label>
              <button
                type="button"
                className="button button-outline"
                disabled={hasInvalid}
                onClick={() => showTable(sheetId, range)}
              >
                Hiện vùng bảng
              </button>
              <button
                type="button"
                className="button button-primary"
                disabled={hasInvalid || !table}
                onClick={() => void download()}
              >
                Tải Excel đã chỉnh
              </button>
            </div>
            <p className="field-help">
              Tối đa 120 dòng × 20 cột mỗi vùng; các sheet và vùng khác vẫn được
              giữ khi tải file. Ô số dùng dấu phẩy hoặc chấm thập phân, không
              dùng dấu phân cách hàng nghìn. Đổi vùng không xóa các chỉnh sửa
              trước đó.
            </p>
          </>
        )}
        {table && (
          <div
            className="excel-table-scroll"
            tabIndex={0}
            role="region"
            aria-label={`Bảng Excel ${table.range}`}
          >
            <table
              className="excel-customer-table"
              style={{
                width:
                  44 + table.columns.reduce((sum, col) => sum + col.width, 0),
              }}
              key={`${fileName}:${sheetId}:${revision}`}
            >
              <colgroup>
                <col style={{ width: 44 }} />
                {table.columns.map((col) => (
                  <col key={col.label} style={{ width: col.width }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <th aria-label="Dòng" />
                  {table.columns.map((col) => (
                    <th key={col.label} scope="col">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row.number} style={{ height: row.height }}>
                    <th scope="row">{row.number}</th>
                    {row.cells.map((cell) => (
                      <td
                        key={cell.address}
                        rowSpan={cell.rowSpan}
                        colSpan={cell.colSpan}
                        style={cell.style as CSSProperties}
                      >
                        {cell.kind === "readonly" ? (
                          <div
                            className="excel-readonly"
                            title={
                              cell.formula
                                ? `=${cell.formula}`
                                : "Giữ nguyên giá trị gốc"
                            }
                          >
                            {cell.formula && formulasStale
                              ? "Tính lại trong Excel"
                              : cell.text ||
                                (cell.formula ? "Công thức Excel" : "")}
                            {cell.formula && <small>Công thức · chỉ xem</small>}
                          </div>
                        ) : (
                          <textarea
                            aria-label={`Ô ${cell.address}`}
                            defaultValue={cell.text}
                            maxLength={10000}
                            rows={1}
                            inputMode={
                              cell.kind === "number" ? "decimal" : "text"
                            }
                            aria-invalid={
                              !!invalidCells[`${sheetId}:${cell.address}`]
                            }
                            onChange={() => {
                              setDirty(true);
                              setFormulasStale(true);
                              setMessage("");
                            }}
                            onBlur={(event) => {
                              const key = `${sheetId}:${cell.address}`;
                              if (
                                event.target.value ===
                                (committed.current.get(key) ?? cell.text)
                              ) {
                                setInvalidCells((current) => {
                                  const next = { ...current };
                                  delete next[`${sheetId}:${cell.address}`];
                                  return next;
                                });
                                return;
                              }
                              try {
                                session!.edit(
                                  sheetId,
                                  cell.address,
                                  event.target.value,
                                );
                                committed.current.set(key, event.target.value);
                                setDirty(true);
                                setMessage("");
                                setInvalidCells((current) => {
                                  const next = { ...current };
                                  delete next[`${sheetId}:${cell.address}`];
                                  return next;
                                });
                              } catch (err) {
                                setInvalidCells((current) => ({
                                  ...current,
                                  [`${sheetId}:${cell.address}`]:
                                    errorMessage(err),
                                }));
                              }
                            }}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </fieldset>
      {busy && <p role="status">Đang xử lý file Excel…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {hasInvalid && (
        <p className="form-error" role="alert">
          {Object.values(invalidCells).join(" ")}
        </p>
      )}
      {message && (
        <p className="estimate-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
