import type { Estimate } from "@/domain/estimates";
import {
  calculateEstimate,
  formatMoney,
  formatVolume,
  paymentLabels,
  unitLabel,
} from "@/domain/estimates";

export default function EstimateSheet({
  document: doc,
  paperRef,
}: {
  document: Estimate;
  paperRef?: React.Ref<HTMLElement>;
}) {
  const result = calculateEstimate(doc);
  return (
    <article className="estimate-paper" ref={paperRef}>
      <header className="estimate-paper-heading">
        <h2>{doc.companyName}</h2>
        <p>{doc.companyAddress}</p>
        {doc.companyPhone && <p>Điện thoại: {doc.companyPhone}</p>}
        <h1>{doc.title}</h1>
        <p>
          Số: {doc.code} · Ngày: {doc.date.split("-").reverse().join("/")}
        </p>
      </header>
      <div className="estimate-paper-recipient">
        <p>
          <strong>Kính gửi:</strong> {doc.customerName || "………………………………"}
        </p>
        <p>
          <strong>Công trình:</strong> {doc.projectAddress || "………………………………"}
        </p>
      </div>
      <table className="estimate-paper-table">
        <colgroup>
          {[4, 30, 7, 7, 5, 6, 11, 14, 16].map((width, i) => (
            <col key={i} style={{ width: `${width}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>STT</th>
            <th>DIỄN GIẢI</th>
            <th>
              RỘNG
              <br />
              (mm)
            </th>
            <th>
              CAO
              <br />
              (mm)
            </th>
            <th>SL</th>
            <th>ĐVT</th>
            <th>KHỐI LƯỢNG</th>
            <th>
              ĐƠN GIÁ
              <br />
              (đ)
            </th>
            <th>
              THÀNH TIỀN
              <br />
              (đ)
            </th>
          </tr>
        </thead>
        <tbody>
          {result.lines.map((line, index) => (
            <tr key={line.id}>
              <td>{index + 1}</td>
              <td>
                {line.description}
                {line.agreedAmount !== null && <small> (giá chốt)</small>}
              </td>
              <td>{line.width ? formatMoney(line.width) : "—"}</td>
              <td>{line.height ? formatMoney(line.height) : "—"}</td>
              <td>{line.quantity}</td>
              <td>{unitLabel[line.unit]}</td>
              <td>{formatVolume(line.volume)}</td>
              <td>{formatMoney(line.unitPrice)}</td>
              <td>{formatMoney(line.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={8}>TỔNG CỘNG (đồng)</th>
            <th>{formatMoney(result.total)}</th>
          </tr>
        </tfoot>
      </table>
      <div className="estimate-paper-payments">
        {doc.payments.map((percent, i) => (
          <p key={i}>
            {paymentLabels[i]} ({percent}%):{" "}
            <strong>{formatMoney(result.paymentAmounts[i])} đồng</strong>
          </p>
        ))}
      </div>
      {doc.notes && (
        <p className="estimate-paper-notes">
          <strong>Ghi chú:</strong> {doc.notes}
        </p>
      )}
      {result.lines.some((line) => line.agreedAmount !== null) && (
        <p className="estimate-paper-notes">
          Các dòng ghi “giá chốt” dùng số tiền thỏa thuận thay cho khối lượng ×
          đơn giá.
        </p>
      )}
      <div className="estimate-paper-signatures">
        <div>
          <strong>ĐẠI DIỆN CỬA HÀNG</strong>
          <span>{doc.signatory}</span>
        </div>
        <div>
          <strong>KHÁCH HÀNG</strong>
          <span>(Ký, ghi rõ họ tên)</span>
        </div>
      </div>
    </article>
  );
}
