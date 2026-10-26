"use client";
import type { LeadInput } from "@/domain/models";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
import FormVerification, {
  type FormVerificationState,
} from "./FormVerification";
export default function ConsultationForm() {
  const params = useSearchParams();
  const { publishedProducts: products, addLead } = useSite();
  const [selected, setSelected] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [verification, setVerification] = useState<FormVerificationState>({
    ready: false,
    token: "",
  });
  const [verificationAttempt, setVerificationAttempt] = useState(0);
  const inFlight = useRef(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const submissionKey = useRef<string | null>(null);
  useEffect(() => {
    setSelected(params.get("product") || "");
  }, [params]);
  useEffect(() => {
    if (success) resultRef.current?.focus();
  }, [success]);
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || inFlight.current) return;
    if (!verification.ready) {
      setError("Vui lòng hoàn tất xác minh trước khi gửi.");
      return;
    }
    const form = event.currentTarget;
    const values = new FormData(form);
    const phone = String(values.get("phone")).replace(/[\s.()-]/g, "");
    if (!/^(0[35789]\d{8}|\+84[35789]\d{8})$/.test(phone)) {
      setError(
        "Vui lòng nhập số điện thoại Việt Nam hợp lệ, ví dụ 0901234567.",
      );
      return;
    }
    const name = String(values.get("name")).trim();
    if (name.length < 2) {
      setError("Vui lòng nhập họ tên từ 2 ký tự.");
      return;
    }
    if (values.get("contactAcknowledged") !== "on") {
      setError("Vui lòng đồng ý để cơ sở liên hệ theo yêu cầu.");
      return;
    }
    inFlight.current = true;
    setSaving(true);
    setError("");
    const product = products.find(
      (item) => item.id === selected && item.status === "published",
    );
    submissionKey.current ||= crypto.randomUUID();
    try {
      const result = await addLead(
        {
          name,
          phone,
          email: String(values.get("email") || "").trim(),
          location: String(values.get("location") || "").trim(),
          message: String(values.get("message") || "").trim(),
          productId: product?.id || "",
          type: String(values.get("type")) as LeadInput["type"],
          source: window.location.pathname,
          contactAcknowledged: true,
          privacyVersion: "2026-10-v1",
          website: String(values.get("website") || ""),
        },
        submissionKey.current,
        verification.token,
      );
      if (result.ok) {
        setSuccess(result.code);
        form.reset();
      } else {
        setError(result.error);
        if (result.status === 409) submissionKey.current = null;
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
      setVerification({ ready: false, token: "" });
      setVerificationAttempt((value) => value + 1);
    }
  }
  if (success)
    return (
      <div className="form-success" ref={resultRef} tabIndex={-1} role="status">
        <span className="success-icon">
          <Icon name="check" size={30} />
        </span>
        <span className="eyebrow">ĐÃ TIẾP NHẬN YÊU CẦU</span>
        <h2>Cảm ơn bạn đã chia sẻ.</h2>
        <p>
          Mã yêu cầu: <strong>{success}</strong>
        </p>
        <p>
          Yêu cầu đã được lưu vào hệ thống Thanh Phong để người phụ trách xem và
          liên hệ.
        </p>
        <div className="button-row">
          <Link href="/products" className="button button-primary">
            Tiếp tục xem sản phẩm <Icon name="arrow" size={16} />
          </Link>
          <button
            className="button button-outline"
            onClick={() => {
              setSuccess("");
              setSelected("");
              submissionKey.current = null;
            }}
          >
            Gửi yêu cầu khác
          </button>
        </div>
      </div>
    );
  return (
    <form className="consultation-form" onSubmit={submit}>
      <div className="form-title">
        <span className="eyebrow">CHIA SẺ NHU CẦU CỦA BẠN</span>
        <h2>Bắt đầu từ một cuộc trao đổi.</h2>
        <p>Điền thông tin bên dưới để người phụ trách tư vấn cho bạn.</p>
      </div>
      <div className="form-grid">
        <div className="form-honeypot" aria-hidden="true">
          <label>
            Để trống ô này
            <input
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              maxLength={200}
            />
          </label>
        </div>
        <label>
          Họ và tên <span>*</span>
          <input
            name="name"
            placeholder="Tên của bạn"
            autoComplete="name"
            required
            maxLength={100}
            minLength={2}
          />
        </label>
        <label>
          Số điện thoại <span>*</span>
          <input
            name="phone"
            type="tel"
            placeholder="Số điện thoại liên hệ"
            autoComplete="tel"
            required
            maxLength={18}
          />
        </label>
        <label>
          Email <small>(không bắt buộc)</small>
          <input
            name="email"
            type="email"
            placeholder="Email của bạn"
            autoComplete="email"
            maxLength={150}
          />
        </label>
        <label>
          Khu vực công trình
          <input
            name="location"
            placeholder="Quận/huyện, tỉnh/thành"
            autoComplete="address-level2"
            maxLength={200}
          />
        </label>
        <label className="full-width">
          Bạn quan tâm đến mẫu nào?
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            name="product"
          >
            <option value="">Tôi muốn được tư vấn phương án</option>
            {products
              .filter((item) => item.status === "published")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        <fieldset className="full-width request-type">
          <legend>Nhu cầu của bạn</legend>
          <label>
            <input type="radio" name="type" value="quotation" defaultChecked />
            Nhận báo giá
          </label>
          <label>
            <input type="radio" name="type" value="survey" />
            Khảo sát công trình
          </label>
          <label>
            <input type="radio" name="type" value="consultation" />
            Tư vấn mẫu
          </label>
        </fieldset>
        <label className="full-width">
          Chia sẻ thêm về ý tưởng
          <textarea
            name="message"
            placeholder="Loại công trình, kích thước dự kiến, kiểu cửa hoặc điều bạn quan tâm..."
            rows={4}
            maxLength={2000}
          />
        </label>
      </div>
      <label className="consent-field">
        <input type="checkbox" name="contactAcknowledged" required />
        <span>
          Tôi đồng ý để Thanh Phong lưu thông tin và liên hệ theo yêu cầu này.{" "}
          <Link href="/policies/privacy">Xem cách xử lý thông tin.</Link>
        </span>
      </label>
      <p className="form-demo-note">
        <Icon name="eye" size={16} />
        Thông tin chỉ dùng để tiếp nhận, tư vấn và xử lý nhu cầu của bạn.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <FormVerification key={verificationAttempt} onChange={setVerification} />
      <button
        type="submit"
        className="button button-primary submit-button"
        disabled={saving || !verification.ready}
        aria-busy={saving}
      >
        <Icon name="file" size={20} />
        <span>{saving ? "Đang gửi..." : "Gửi yêu cầu tư vấn"}</span>
      </button>
    </form>
  );
}
