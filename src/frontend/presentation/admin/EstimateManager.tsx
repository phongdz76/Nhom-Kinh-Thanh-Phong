"use client";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
import EstimateSheet from "./EstimateSheet";
import {
  calculateEstimate,
  calculateLine,
  formatMoney,
  formatVolume,
  paymentLabels,
  unitLabel,
  type Estimate,
  type EstimateLine,
} from "@/domain/estimates";
import {
  newLine,
  useEstimateEditor,
} from "@/frontend/presentation/hooks/useEstimateEditor";
import { estimateService } from "@/frontend/composition/services";
export default function EstimateManager() {
  const { settings, user } = useSite();
  const {
    draft,
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
  } = useEstimateEditor(settings, user, estimateService);
  function numberField(
    line: EstimateLine,
    name: "width" | "height" | "quantity" | "volume" | "unitPrice",
    label: string,
    max: number,
    step = 1,
    disabled = false,
  ) {
    return (
      <label>
        {label}
        <input
          type="number"
          aria-label={`${label} hạng mục ${draft.lines.indexOf(line) + 1}`}
          min={0}
          max={max}
          step={step}
          value={line[name] || ""}
          disabled={disabled}
          onChange={(event) =>
            changeLine(line.id, {
              [name]:
                step === 1
                  ? Math.trunc(
                      Math.max(
                        0,
                        Math.min(max, Number(event.target.value) || 0),
                      ),
                    )
                  : Math.max(0, Math.min(max, Number(event.target.value) || 0)),
            })
          }
        />
      </label>
    );
  }
  return (
    <div className="estimate-workspace">
      <section className="admin-panel estimate-intro">
        <div>
          <h2>Lập báo giá & quyết toán</h2>
          <p>
            Thành tiền = Khối lượng × Đơn giá. Kích thước nhập bằng mm; khối
            lượng tính theo m², mét dài hoặc bộ.
          </p>
        </div>
        <div className="estimate-actions">
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={reset}
          >
            Tạo báo giá mới
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={loadExample}
          >
            Nạp file mẫu
          </button>
        </div>
      </section>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="estimate-message" role="status">
          {message}
        </p>
      )}
      <form
        className="admin-panel estimate-editor"
        onSubmit={(event) => {
          event.preventDefault();
          perform("save");
        }}
      >
        <fieldset disabled={busy}>
          <legend>Thông tin báo giá</legend>
          <div className="form-grid">
            <label>
              Mã báo giá
              <input
                name="estimateCode"
                value={draft.code}
                maxLength={40}
                onChange={(event) => change("code", event.target.value)}
                required
              />
            </label>
            <label>
              Ngày lập
              <input
                type="date"
                value={draft.date}
                onChange={(event) => change("date", event.target.value)}
                required
              />
            </label>
            <label>
              Khách hàng
              <input
                name="customerName"
                value={draft.customerName}
                maxLength={100}
                onChange={(event) => change("customerName", event.target.value)}
                required
              />
            </label>
            <label>
              Công trình
              <input
                value={draft.projectAddress}
                maxLength={300}
                onChange={(event) =>
                  change("projectAddress", event.target.value)
                }
              />
            </label>
            <label className="full-width">
              Loại bảng
              <select
                value={draft.title}
                onChange={(event) =>
                  change("title", event.target.value as Estimate["title"])
                }
              >
                <option>BẢNG BÁO GIÁ NHÔM KÍNH</option>
                <option>BẢNG QUYẾT TOÁN KHỐI LƯỢNG NHÔM KÍNH</option>
              </select>
            </label>
          </div>
        </fieldset>
        <div className="estimate-section-heading">
          <h3>
            Hạng mục thi công <small>({draft.lines.length}/40)</small>
          </h3>
          <span>Kích thước: mm · Đơn giá: đồng / ĐVT</span>
        </div>
        <div className="estimate-line-list">
          {draft.lines.map((line, index) => {
            const result = calculateLine(line);
            return (
              <fieldset className="estimate-line" key={line.id} disabled={busy}>
                <legend>Hạng mục {index + 1}</legend>
                <div className="estimate-line-heading">
                  <label>
                    Diễn giải
                    <textarea
                      aria-label={`Diễn giải hạng mục ${index + 1}`}
                      value={line.description}
                      maxLength={400}
                      rows={2}
                      required
                      onChange={(event) =>
                        changeLine(line.id, { description: event.target.value })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={`Xóa hạng mục ${index + 1}`}
                    disabled={draft.lines.length === 1}
                    onClick={() =>
                      change(
                        "lines",
                        draft.lines.filter((item) => item.id !== line.id),
                      )
                    }
                  >
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <div className="estimate-line-fields">
                  <label>
                    Đơn vị
                    <select
                      aria-label={`Đơn vị hạng mục ${index + 1}`}
                      value={line.unit}
                      onChange={(event) =>
                        changeLine(line.id, {
                          unit: event.target.value as EstimateLine["unit"],
                        })
                      }
                    >
                      <option value="m2">m²</option>
                      <option value="bo">Bộ</option>
                      <option value="md">Mét dài</option>
                    </select>
                  </label>
                  <label>
                    Cách nhập
                    <select
                      aria-label={`Cách nhập hạng mục ${index + 1}`}
                      value={line.measurement}
                      onChange={(event) =>
                        changeLine(line.id, {
                          measurement: event.target
                            .value as EstimateLine["measurement"],
                        })
                      }
                    >
                      <option value="dimensions">
                        Từ kích thước / số lượng
                      </option>
                      <option value="manual">Nhập khối lượng trực tiếp</option>
                    </select>
                  </label>
                  {line.measurement === "manual" ? (
                    numberField(
                      line,
                      "volume",
                      "Khối lượng",
                      1_000_000,
                      0.000001,
                    )
                  ) : (
                    <>
                      {line.unit !== "bo" &&
                        numberField(
                          line,
                          "width",
                          line.unit === "md" ? "Chiều dài (mm)" : "Rộng (mm)",
                          20000,
                        )}
                      {line.unit === "m2" &&
                        numberField(line, "height", "Cao (mm)", 20000)}
                      {numberField(line, "quantity", "Số lượng", 1000)}
                    </>
                  )}
                  {numberField(line, "unitPrice", "Đơn giá (đ)", 100_000_000)}
                </div>
                <div className="estimate-line-result">
                  <p>
                    Khối lượng:{" "}
                    <strong>
                      {formatVolume(result.volume)} {unitLabel[line.unit]}
                    </strong>
                  </p>
                  <p>
                    Tự tính: <strong>{formatMoney(result.baseAmount)}đ</strong>
                  </p>
                  <p>
                    Thành tiền: <strong>{formatMoney(result.amount)}đ</strong>
                  </p>
                </div>
                <label className="estimate-agreed-toggle">
                  <input
                    type="checkbox"
                    checked={line.agreedAmount !== null}
                    onChange={(event) =>
                      changeLine(line.id, {
                        agreedAmount: event.target.checked
                          ? result.baseAmount
                          : null,
                      })
                    }
                  />
                  Dùng giá chốt riêng cho dòng này
                </label>
                {line.agreedAmount !== null && (
                  <div className="estimate-agreed">
                    <label>
                      Giá chốt (đ)
                      <input
                        aria-label={`Giá chốt hạng mục ${index + 1}`}
                        type="number"
                        min={0}
                        max={1e12}
                        step={1}
                        value={line.agreedAmount}
                        onChange={(event) =>
                          changeLine(line.id, {
                            agreedAmount: Math.trunc(
                              Math.max(
                                0,
                                Math.min(1e12, Number(event.target.value) || 0),
                              ),
                            ),
                          })
                        }
                      />
                    </label>
                    <p>
                      Chênh lệch so với tự tính:{" "}
                      {formatMoney(result.adjustment)}đ. Giá chốt sẽ được ghi rõ
                      trong bản xuất.
                    </p>
                  </div>
                )}
              </fieldset>
            );
          })}
        </div>
        <button
          type="button"
          className="button button-outline"
          disabled={busy || draft.lines.length >= 40}
          onClick={() => change("lines", [...draft.lines, newLine()])}
        >
          <Icon name="plus" size={16} /> Thêm hạng mục
        </button>
        <div className="estimate-summary">
          <p>
            Tổng theo khối lượng × đơn giá{" "}
            <strong>{formatMoney(calculation.baseTotal)}đ</strong>
          </p>
          {calculation.adjustment !== 0 && (
            <p>
              Điều chỉnh giá chốt{" "}
              <strong>{formatMoney(calculation.adjustment)}đ</strong>
            </p>
          )}
          <p className="estimate-total">
            TỔNG THANH TOÁN{" "}
            <strong data-testid="estimate-total">
              {formatMoney(calculation.total)}đ
            </strong>
          </p>
        </div>
        <details className="estimate-details">
          <summary>Thông tin cơ sở, thanh toán & ghi chú</summary>
          <div className="form-grid">
            <label className="full-width">
              Tên cơ sở
              <input
                value={draft.companyName}
                maxLength={150}
                required
                onChange={(event) => change("companyName", event.target.value)}
              />
            </label>
            <label className="full-width">
              Địa chỉ cơ sở
              <input
                value={draft.companyAddress}
                maxLength={300}
                onChange={(event) =>
                  change("companyAddress", event.target.value)
                }
              />
            </label>
            <label>
              Điện thoại cơ sở
              <input
                value={draft.companyPhone}
                maxLength={100}
                onChange={(event) => change("companyPhone", event.target.value)}
              />
            </label>
            <label>
              Người đại diện
              <input
                value={draft.signatory}
                maxLength={100}
                onChange={(event) => change("signatory", event.target.value)}
              />
            </label>
            {draft.payments.map((percent, index) => (
              <label key={index}>
                {paymentLabels[index]} (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={percent}
                  onChange={(event) =>
                    change(
                      "payments",
                      draft.payments.map((current, i) =>
                        i === index
                          ? Math.trunc(
                              Math.max(
                                0,
                                Math.min(100, Number(event.target.value) || 0),
                              ),
                            )
                          : current,
                      ) as Estimate["payments"],
                    )
                  }
                />
                <small>{formatMoney(calculation.paymentAmounts[index])}đ</small>
              </label>
            ))}
            <label className="full-width">
              Ghi chú
              <textarea
                rows={3}
                value={draft.notes}
                maxLength={800}
                onChange={(event) => change("notes", event.target.value)}
              />
            </label>
          </div>
        </details>
        <div className="estimate-actions estimate-save-actions">
          <button
            type="submit"
            className="button button-primary"
            disabled={busy}
          >
            {busy ? "Đang xử lý…" : "Lưu báo giá"}
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={() => perform("xlsx")}
          >
            Xuất Excel (.xlsx)
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={() => perform("docx")}
          >
            Xuất Word (.docx)
          </button>
          <button
            type="button"
            className="button button-outline"
            disabled={busy}
            onClick={() => perform("print")}
          >
            Lưu & in A4
          </button>
          <button
            type="button"
            className="text-link"
            onClick={() => setPreview(!preview)}
          >
            {preview ? "Ẩn xem trước" : "Xem trước A4"}
          </button>
        </div>
        <p className="field-help">
          {dirty ? "Có thay đổi chưa lưu. " : ""}Xuất file và in sẽ lưu nội dung
          hiện tại trước. Thông tin chỉ dùng trong quản trị.
        </p>
      </form>
      {preview && (
        <section
          className="estimate-preview-scroll"
          aria-label="Xem trước báo giá A4"
        >
          <EstimateSheet document={draft} />
        </section>
      )}
      {source && (
        <section className="admin-panel estimate-audit">
          <h2>Đối chiếu file mẫu</h2>
          <p>
            File gốc: <strong>{formatMoney(source.originalTotal)}đ</strong> ·
            Tính theo kích thước:{" "}
            <strong>
              {formatMoney(calculateEstimate(source.document).total)}đ
            </strong>
            . Khối lượng trong file gốc đang được nhập tay với hệ số khác m²
            chuẩn.
          </p>
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tiền trong file</th>
                  <th>Tính tự động</th>
                  <th>Chênh lệch</th>
                </tr>
              </thead>
              <tbody>
                {source.audit.map((item, i) => {
                  const result = calculateLine(source.document.lines[i]);
                  return (
                    <tr key={item.index}>
                      <td>{item.index}</td>
                      <td>{formatMoney(item.originalAmount)}đ</td>
                      <td>{formatMoney(result.baseAmount)}đ</td>
                      <td>
                        {formatMoney(result.baseAmount - item.originalAmount)}đ
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <section className="admin-panel estimate-saved">
        <h2>Báo giá đã lưu ({totalRecords})</h2>
        <p>
          Chọn một bản để mở và chỉnh sửa. Danh sách hiển thị tối đa 200 bản gần
          nhất.
        </p>
        {records.length ? (
          <div className="table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã báo giá</th>
                  <th>Khách hàng / công trình</th>
                  <th>Tổng tiền</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.code}</td>
                    <td>
                      {record.customerName}
                      <small>{record.projectAddress}</small>
                    </td>
                    <td>{formatMoney(record.total)}đ</td>
                    <td>
                      <button
                        type="button"
                        className="text-link"
                        disabled={busy}
                        onClick={() => openRecord(record.id)}
                      >
                        Mở báo giá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>Chưa có báo giá được lưu.</p>
        )}
      </section>
    </div>
  );
}
