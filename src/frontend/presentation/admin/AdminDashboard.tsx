"use client";
import type {
  Lead,
  LeadEvent,
  LeadUpdate,
  MutationResult,
  Product,
  Settings,
} from "@/domain/models";
import { productSchema } from "@/domain/schemas";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Brand from "@/frontend/presentation/shared/Brand";
import BrandLink from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";

import { EmptyState } from "@/frontend/presentation/shared/Shared";
import ContentManager from "@/frontend/presentation/admin/ContentManager";
import PasswordForm from "@/frontend/presentation/admin/PasswordForm";
import { ZaloQrCode } from "@/frontend/presentation/website/ZaloContact";
import EstimateManager from "@/frontend/presentation/admin/EstimateManager";

const tabs = [
  { id: "overview", name: "Tổng quan", icon: "grid" },
  { id: "products", name: "Sản phẩm", icon: "door" },
  { id: "leads", name: "Yêu cầu tư vấn", icon: "message" },
  { id: "estimates", name: "Báo giá & tính tiền", icon: "file" },
  { id: "media", name: "Thư viện ảnh", icon: "image" },
  { id: "content", name: "Nội dung website", icon: "file" },
  { id: "settings", name: "Cài đặt cơ sở", icon: "settings" },
  { id: "security", name: "Mật khẩu & bảo mật", icon: "shield" },
];
const statuses = {
  new: "Mới tiếp nhận",
  contacted: "Đã liên hệ",
  survey: "Hẹn khảo sát",
  quoted: "Đã báo giá",
  won: "Chốt thi công",
  lost: "Không tiếp tục",
};

function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      element.close();
    };
  }, []);
  return (
    <dialog
      className={`admin-dialog ${wide ? "dialog-wide" : ""}`}
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">THANH PHONG · QUẢN TRỊ</span>
          <h2>{title}</h2>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [defaultCode] = useState(
    () => product?.code || `TP-${Date.now().toString().slice(-5)}`,
  );
  const { saveProduct, products, uploadImage, categories } = useSite();
  const [image, setImage] = useState(
    product?.image || "/images/hero-house.jpg",
  );
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function readImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setError("Chọn ảnh JPG, PNG hoặc WebP không quá 8 MB.");
      return;
    }
    setReading(true);
    setError("");
    const result = await uploadImage(file, product?.name || file.name);
    if (result.ok) setImage(result.url);
    else setError(result.error);
    setReading(false);
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const code = String(values.get("code")).trim().toUpperCase();
    const name = String(values.get("name")).trim();
    if (name.length < 3) {
      setError("Tên sản phẩm cần ít nhất 3 ký tự.");
      return;
    }
    if (
      products.some(
        (item) => item.code.toUpperCase() === code && item.id !== product?.id,
      )
    ) {
      setError("Mã sản phẩm đã được dùng. Vui lòng chọn mã khác.");
      return;
    }
    const item = {
      ...product,
      id: product?.id || `demo-${crypto.randomUUID()}`,
      code,
      name,
      category: String(values.get("category")),
      opening: String(values.get("opening")),
      color: String(values.get("color")).trim(),
      summary: String(values.get("summary")).trim(),
      subtitle: String(values.get("subtitle")).trim(),
      image,
      images: [
        image,
        ...(product?.images || []).filter((src) => src !== image),
      ],
      status: String(values.get("status")),
      featured: values.get("featured") === "on",
      tag: product?.tag || "Mẫu mới",
    };
    const parsed = productSchema.safeParse(item);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const result = await saveProduct(parsed.data);
    if (result.ok) onSaved();
    else setError(result.error);
  }
  return (
    <Modal
      title={product ? "Chỉnh sửa sản phẩm" : "Thêm mẫu sản phẩm"}
      onClose={onClose}
      wide
    >
      <form onSubmit={save} className="editor-form">
        <div className="editor-layout">
          <div>
            <div className="form-grid">
              <label className="full-width">
                Tên sản phẩm *
                <input
                  name="name"
                  defaultValue={product?.name}
                  placeholder="Ví dụ: Cửa nhôm mở quay 4 cánh"
                  required
                  maxLength={150}
                />
              </label>
              <label>
                Mã sản phẩm *
                <input
                  name="code"
                  defaultValue={defaultCode}
                  required
                  maxLength={30}
                  pattern="[a-zA-Z0-9-]+"
                />
              </label>
              <label>
                Danh mục
                <select
                  name="category"
                  defaultValue={product?.category || "doors"}
                >
                  {categories
                    .filter((item) => item.id !== "all")
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Kiểu mở
                <select
                  name="opening"
                  defaultValue={product?.opening || "Mở quay"}
                >
                  {[
                    "Mở quay",
                    "Mở lùa",
                    "Mở hất",
                    "Xếp trượt",
                    "Cố định",
                    "Vách cố định",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Màu sắc gợi ý
                <input
                  name="color"
                  defaultValue={product?.color}
                  placeholder="Xám ghi, đen nhám..."
                  maxLength={80}
                />
              </label>
              <label className="full-width">
                Dòng giới thiệu ngắn
                <input
                  name="subtitle"
                  defaultValue={product?.subtitle}
                  placeholder="Một câu mô tả cho mẫu sản phẩm"
                  maxLength={150}
                />
              </label>
              <label className="full-width">
                Mô tả *
                <textarea
                  name="summary"
                  defaultValue={product?.summary}
                  placeholder="Mô tả ý tưởng, công năng và không gian sử dụng..."
                  required
                  rows={4}
                  maxLength={2000}
                />
              </label>
            </div>
          </div>
          <aside className="editor-aside">
            <label>Ảnh đại diện</label>
            <div className="editor-image">
              <img src={image} alt="Ảnh đại diện sản phẩm đang chỉnh sửa" />
            </div>
            <label className="button button-outline upload-label">
              <Icon name="upload" size={16} />
              {reading ? "Đang đọc ảnh..." : "Chọn ảnh từ thiết bị"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={readImage}
                className="sr-only"
              />
            </label>
            <p className="field-hint">
              JPG, PNG, WebP · Tối đa 8 MB.
              <br />
              Ảnh được lưu trong thư viện của website.
            </p>
            <label>
              Trạng thái
              <select name="status" defaultValue={product?.status || "draft"}>
                <option value="draft">Bản nháp — chưa hiển thị</option>
                <option value="published">Xuất bản — hiện trên website</option>
              </select>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured}
              />
              Mẫu nổi bật trên trang chủ
            </label>
            <p className="inline-notice">
              Giá hiển thị “Tư vấn theo cấu hình” khi chưa có đơn giá được
              duyệt.
            </p>
          </aside>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <span>Thay đổi được lưu trên máy chủ.</span>
          <button
            type="button"
            className="button button-outline"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="button button-primary"
            type="submit"
            disabled={reading}
          >
            Lưu sản phẩm <Icon name="check" size={17} />
          </button>
        </div>
      </form>
    </Modal>
  );
}

function LeadEditor({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { updateLead, getLeadDetails } = useSite();
  const [events, setEvents] = useState<LeadEvent[]>([]);
  useEffect(() => {
    getLeadDetails(lead.id)
      .then((result) => setEvents(result.events))
      .catch(() => {});
  }, [lead.id, getLeadDetails]);
  const [error, setError] = useState("");
  return (
    <Modal title="Chi tiết yêu cầu tư vấn" onClose={onClose}>
      <div className="lead-detail">
        <span className="badge badge-blue">{lead.code}</span>
        <h3>{lead.name}</h3>
        <dl className="specification-list">
          <div>
            <dt>Số điện thoại</dt>
            <dd>{lead.phone}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{lead.email || "Chưa cung cấp"}</dd>
          </div>
          <div>
            <dt>Khu vực</dt>
            <dd>{lead.location || "Chưa cung cấp"}</dd>
          </div>
          <div>
            <dt>Mẫu quan tâm</dt>
            <dd>{lead.productName}</dd>
          </div>
          <div>
            <dt>Thời gian</dt>
            <dd>
              {new Date(lead.createdAt).toLocaleString("vi-VN", {
                timeZone: "Asia/Ho_Chi_Minh",
              })}
            </dd>
          </div>
        </dl>
        <p className="lead-message">
          {lead.message || "Không có ghi chú từ người gửi."}
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const result = await updateLead(lead.id, {
              status: String(values.get("status")) as LeadUpdate["status"],
              note: String(values.get("note")),
            });
            if (result.ok) onClose();
            else setError(result.error);
          }}
        >
          <label>
            Trạng thái xử lý
            <select name="status" defaultValue={lead.status}>
              {Object.entries(statuses).map(([id, label]) => (
                <option value={id} key={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ghi chú nội bộ
            <textarea
              name="note"
              rows={3}
              maxLength={2000}
              defaultValue={lead.note || ""}
              placeholder="Ghi chú cuộc trao đổi, thời gian cần liên hệ lại..."
            />
          </label>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <button className="button button-primary" type="submit">
            Lưu cập nhật <Icon name="check" size={16} />
          </button>
        </form>
        <section className="lead-history">
          <h3>Lịch sử xử lý</h3>
          {events.map((event, index) => (
            <div key={index}>
              <small>
                {new Date(event.createdAt).toLocaleString("vi-VN", {
                  timeZone: "Asia/Ho_Chi_Minh",
                })}
              </small>
              <strong>
                {event.toStatus ? statuses[event.toStatus] : "Cập nhật yêu cầu"}
              </strong>
              {event.note && <p>{event.note}</p>}
            </div>
          ))}
        </section>
      </div>
    </Modal>
  );
}

export default function AdminDashboard() {
  const {
    products,
    leads,
    settings,
    saveSettings,
    saveProduct,
    loading,
    user,
    logout,
    notificationConfigured,
    categories,
    media = [],
    storageError,
  } = useSite();
  const [tab, setTab] = useState("overview");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editor, setEditor] = useState<Product | { id?: never } | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [toast, setToast] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const value =
      new URLSearchParams(window.location.search).get("tab") || "overview";
    if (
      tabs.some((item) => item.id === value) &&
      (user?.role === "owner" ||
        !["leads", "settings", "estimates"].includes(value))
    )
      setTab(value);
  }, [user?.role]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  function changeTab(value: string) {
    setTab(value);
    setQuery("");
    setStatusFilter("all");
    setMobileOpen(false);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", value);
    window.history.replaceState(null, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  const visibleTabs = tabs.filter(
    (item) =>
      user?.role === "owner" ||
      !["leads", "settings", "estimates"].includes(item.id),
  );
  const published = products.filter((item) => item.status === "published");
  const newLeads = leads.filter((item) => item.status === "new");
  const visibleProducts = products.filter(
    (item) =>
      `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase()) &&
      (statusFilter === "all" || item.status === statusFilter),
  );
  const visibleLeads = leads.filter(
    (item) =>
      `${item.name} ${item.phone} ${item.productName}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (statusFilter === "all" || item.status === statusFilter),
  );
  if (loading)
    return (
      <main className="empty-state">
        <Brand />
        <h1>Đang tải dữ liệu quản trị...</h1>
      </main>
    );
  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <BrandLink
          className="admin-brand"
          aria-label="Về website Thanh Phong"
        />
        <div className="workspace-label">
          <span className="workspace-dot" />
          KHÔNG GIAN QUẢN TRỊ
        </div>
        <nav aria-label="Menu quản trị">
          {visibleTabs.map((item) => (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => changeTab(item.id)}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.name}</span>
              {item.id === "leads" && newLeads.length > 0 && (
                <small>{newLeads.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-logout" onClick={logout}>
            <Icon name="logout" size={18} />
            Đăng xuất
          </button>
          <div className="admin-user">
            <span>TP</span>
            <div>
              <strong>{user?.name || "Quản trị viên"}</strong>
              <small>{user?.email}</small>
            </div>
          </div>
        </div>
      </aside>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Đóng menu quản trị"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div className="admin-body">
        <header className="admin-topbar">
          <div>
            <button
              className="icon-button admin-menu-button"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Mở menu quản trị"
            >
              <Icon name="menu" />
            </button>
            <span>
              Quản trị <Icon name="chevron" size={12} />
              <strong>{tabs.find((item) => item.id === tab)?.name}</strong>
            </span>
          </div>
        </header>
        <main className="admin-content">
          <div className="admin-page-heading">
            <div>
              <span className="eyebrow">THANH PHONG WORKSPACE</span>
              <h1>
                {tab === "overview"
                  ? "Một góc nhìn tổng thể."
                  : tabs.find((item) => item.id === tab)?.name}
              </h1>
              <p>
                {tab === "overview"
                  ? "Nội dung website và những cuộc trao đổi, trong cùng một không gian."
                  : tab === "products"
                    ? "Thêm mẫu, chỉnh sửa nội dung và lựa chọn sản phẩm hiển thị."
                    : tab === "leads"
                      ? "Theo dõi và xử lý yêu cầu tư vấn từ website."
                      : tab === "estimates"
                        ? "Tính khối lượng, thành tiền và lập bảng báo giá nội bộ."
                        : tab === "security"
                          ? "Đổi mật khẩu và bảo vệ tài khoản quản trị của bạn."
                          : tab === "settings"
                            ? "Cập nhật thông tin liên hệ hiển thị trên website."
                            : "Khám phá cách tổ chức nội dung và hình ảnh của website."}
              </p>
            </div>
            {tab === "products" || tab === "overview" ? (
              <button
                className="button button-primary"
                onClick={() => setEditor({})}
              >
                <Icon name="plus" size={18} />
                Thêm sản phẩm
              </button>
            ) : null}
          </div>
          {storageError && (
            <p className="form-error" role="alert">
              {storageError}
            </p>
          )}
          {tab === "overview" && (
            <>
              <div className="admin-stats">
                {[
                  [
                    "door",
                    "Mẫu sản phẩm",
                    products.length,
                    `${published.length} đang xuất bản`,
                    "blue",
                  ],
                  [
                    "message",
                    "Yêu cầu tư vấn",
                    leads.length,
                    `${newLeads.length} yêu cầu mới`,
                    "green",
                  ],
                  [
                    "file",
                    "Bản nháp",
                    products.length - published.length,
                    "Sẵn sàng để hoàn thiện",
                    "gold",
                  ],
                  [
                    "image",
                    "Ảnh trong thư viện",
                    new Set([
                      ...products.flatMap(
                        (item) => item.images || [item.image],
                      ),
                      ...media.map((item) => item.url),
                    ]).size,
                    "Ảnh trong nội dung sản phẩm",
                    "purple",
                  ],
                ].map(([icon, title, value, description, color]) => (
                  <div className="stat-card" key={String(title)}>
                    <span className={`stat-icon ${color}`}>
                      <Icon name={String(icon)} size={22} />
                    </span>
                    <p>{title}</p>
                    <strong>{value}</strong>
                    <small>{description}</small>
                  </div>
                ))}
              </div>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Yêu cầu gần đây</h2>
                      <p>Những cuộc trao đổi bắt đầu từ website.</p>
                    </div>
                    <button
                      className="text-link"
                      onClick={() => changeTab("leads")}
                    >
                      Xem tất cả <Icon name="arrow" size={15} />
                    </button>
                  </div>
                  {leads.length ? (
                    <div className="recent-leads">
                      {leads.slice(0, 5).map((lead) => (
                        <button
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <span className="lead-avatar">
                            {lead.name.slice(0, 1).toUpperCase()}
                          </span>
                          <span>
                            <strong>{lead.name}</strong>
                            <small>{lead.productName}</small>
                          </span>
                          <span
                            className={`badge ${lead.status === "new" ? "badge-blue" : "badge-green"}`}
                          >
                            {statuses[lead.status]}
                          </span>
                          <Icon name="chevron" size={16} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Chưa có yêu cầu tư vấn"
                      text="Các yêu cầu từ form tư vấn sẽ hiển thị tại đây."
                    >
                      <Link href="/quotation" className="button button-outline">
                        Mở form báo giá <Icon name="diagonal" size={15} />
                      </Link>
                    </EmptyState>
                  )}
                </section>
                <section className="admin-panel setup-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Chuẩn bị cho website</h2>
                      <p>Từng bước hoàn thiện trước khi ra mắt.</p>
                    </div>
                  </div>
                  {[
                    [true, "Logo & nhận diện", "Đã áp dụng vào giao diện"],
                    [
                      products.length > 0,
                      "Bộ sưu tập sản phẩm",
                      `${products.length} mẫu trong bản xem trước`,
                    ],
                    [
                      !!settings.phone,
                      "Thông tin cơ sở",
                      settings.phone
                        ? "Đã nhập số liên hệ"
                        : "Cần xác nhận hotline, địa chỉ",
                    ],
                    [
                      true,
                      "Dữ liệu & đăng nhập",
                      "Đã kết nối PostgreSQL và xác thực",
                    ],
                  ].map(([done, title, text]) => (
                    <div className="setup-item" key={String(title)}>
                      <span className={done ? "done" : ""}>
                        {done ? <Icon name="check" size={14} /> : <i />}
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <small>{text}</small>
                      </div>
                    </div>
                  ))}
                  <button
                    className="text-link"
                    onClick={() => changeTab("settings")}
                  >
                    Cập nhật thông tin <Icon name="arrow" size={15} />
                  </button>
                </section>
              </div>
              <section className="admin-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Bộ sưu tập trên website</h2>
                    <p>Các mẫu đang được giới thiệu đến người xem.</p>
                  </div>
                  <button
                    className="text-link"
                    onClick={() => changeTab("products")}
                  >
                    Quản lý sản phẩm <Icon name="arrow" size={15} />
                  </button>
                </div>
                <div className="admin-featured-grid">
                  {published.slice(0, 4).map((product) => (
                    <button key={product.id} onClick={() => setEditor(product)}>
                      <img src={product.image} alt={product.name} />
                      <span>{product.name}</span>
                      <small>
                        {product.code} <Icon name="edit" size={13} />
                      </small>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
          {tab === "products" && (
            <section className="admin-panel">
              <div className="admin-table-toolbar">
                <div className="search-field">
                  <Icon name="search" size={18} />
                  <input
                    placeholder="Tìm tên hoặc mã sản phẩm..."
                    aria-label="Tìm trong quản trị sản phẩm"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      className="search-field-clear"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setQuery("")}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
                <select
                  aria-label="Lọc trạng thái sản phẩm"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="published">Đang xuất bản</option>
                  <option value="draft">Bản nháp</option>
                </select>
                <span>{visibleProducts.length} sản phẩm</span>
              </div>
              <div className="table-scroll">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Danh mục</th>
                      <th>Trạng thái</th>
                      <th>Nổi bật</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <div className="table-product">
                            <img src={product.image} alt="" />
                            <div>
                              <strong>{product.name}</strong>
                              <small>{product.code}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {
                            categories.find(
                              (item) => item.id === product.category,
                            )?.name
                          }
                        </td>
                        <td>
                          <span
                            className={`badge ${product.status === "published" ? "badge-green" : "badge-gold"}`}
                          >
                            {product.status === "published"
                              ? "Đang xuất bản"
                              : "Bản nháp"}
                          </span>
                        </td>
                        <td>
                          {product.featured ? (
                            <span className="featured-check">
                              <Icon name="check" size={16} />
                            </span>
                          ) : (
                            <span className="muted">—</span>
                          )}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="icon-button"
                              aria-label={`Sửa ${product.name}`}
                              onClick={() => setEditor(product)}
                            >
                              <Icon name="edit" size={17} />
                            </button>
                            <button
                              className="icon-button"
                              aria-label={`${product.status === "published" ? "Ẩn" : "Xuất bản"} ${product.name}`}
                              onClick={async () => {
                                const result = await saveProduct({
                                  ...product,
                                  status:
                                    product.status === "published"
                                      ? "draft"
                                      : "published",
                                });
                                if (result.ok)
                                  setToast("Đã cập nhật trạng thái sản phẩm.");
                              }}
                            >
                              <Icon
                                name={
                                  product.status === "published"
                                    ? "bookmark"
                                    : "eye"
                                }
                                size={17}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {visibleProducts.length === 0 && (
                <EmptyState
                  title="Chưa có sản phẩm phù hợp"
                  text="Thử từ khóa khác hoặc thêm một mẫu mới."
                />
              )}
              <div className="table-footer">
                Dữ liệu bản xem trước · Thay đổi sẽ hiển thị trên cùng trình
                duyệt.
              </div>
            </section>
          )}
          {tab === "leads" && (
            <section className="admin-panel">
              <div className="admin-table-toolbar">
                <div className="search-field">
                  <Icon name="search" size={18} />
                  <input
                    placeholder="Tìm tên, điện thoại, sản phẩm..."
                    aria-label="Tìm yêu cầu tư vấn"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      className="search-field-clear"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setQuery("")}
                    >
                      <Icon name="close" size={14} />
                    </button>
                  )}
                </div>
                <select
                  aria-label="Lọc yêu cầu"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  {Object.entries(statuses).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {visibleLeads.length ? (
                <div className="table-scroll">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Mẫu quan tâm</th>
                        <th>Trạng thái</th>
                        <th>Thời gian</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLeads.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <strong>{lead.name}</strong>
                            <small>{lead.phone}</small>
                          </td>
                          <td>{lead.productName}</td>
                          <td>
                            <span
                              className={`badge ${lead.status === "new" ? "badge-blue" : "badge-green"}`}
                            >
                              {statuses[lead.status]}
                            </span>
                          </td>
                          <td>
                            {new Date(lead.createdAt).toLocaleDateString(
                              "vi-VN",
                              { timeZone: "Asia/Ho_Chi_Minh" },
                            )}
                          </td>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => setSelectedLead(lead)}
                            >
                              Chi tiết <Icon name="chevron" size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="Chưa có yêu cầu phù hợp"
                  text="Yêu cầu mới từ website được lưu và hiển thị tại đây."
                >
                  <Link className="button button-primary" href="/quotation">
                    Mở form tư vấn <Icon name="diagonal" size={16} />
                  </Link>
                </EmptyState>
              )}
            </section>
          )}
          {tab === "media" && (
            <section className="admin-panel media-panel">
              <div className="panel-heading">
                <div>
                  <h2>Thư viện ảnh sản phẩm</h2>
                  <p>Ảnh đang dùng trong nội dung và thư viện đã tải lên.</p>
                </div>
                <button
                  className="button button-outline"
                  onClick={() => {
                    changeTab("products");
                    setToast("Mở chỉnh sửa sản phẩm để tải ảnh đại diện.");
                  }}
                >
                  Quản lý ảnh theo sản phẩm <Icon name="arrow" size={16} />
                </button>
              </div>
              <div className="media-grid">
                {[
                  ...new Set([
                    ...products.flatMap((item) => item.images || [item.image]),
                    ...media.map((item) => item.url),
                  ]),
                ].map((src, index) => (
                  <figure key={src}>
                    <img src={src} alt={`Ảnh trong thư viện ${index + 1}`} />
                    <figcaption>
                      <Icon name="image" size={14} />
                      {src.startsWith("data:")
                        ? `Ảnh đã tải ${index + 1}`
                        : src.split("/").pop()}
                      <span>
                        {media.some((item) => item.url === src)
                          ? "Ảnh đã tải lên"
                          : "Ảnh minh họa"}
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          )}
          {tab === "content" && <ContentManager />}
          {tab === "estimates" && <EstimateManager />}
          {tab === "security" && <PasswordForm />}
          {tab === "settings" && (
            <SettingsForm
              settings={settings}
              onSave={saveSettings}
              onMessage={setToast}
              notificationConfigured={notificationConfigured}
            />
          )}
          <div className="admin-bottom-note">
            Thanh Phong Workspace · Payload CMS · PostgreSQL
          </div>
        </main>
      </div>
      {editor && (
        <ProductEditor
          product={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setToast("Đã lưu sản phẩm trên máy chủ.");
          }}
        />
      )}
      {selectedLead && (
        <LeadEditor lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
          <button onClick={() => setToast("")} aria-label="Đóng thông báo">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsForm({
  settings,
  onSave,
  onMessage,
  notificationConfigured,
}: {
  settings: Settings;
  onSave: (
    settings: Settings,
  ) => Promise<MutationResult<{ settings: Settings }>>;
  onMessage: (message: string) => void;
  notificationConfigured: boolean;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zalo, setZalo] = useState(settings.zalo || "");
  const [zaloQr, setZaloQr] = useState(settings.zaloQr || "");
  const { uploadImage } = useSite();
  useEffect(() => {
    setZalo(settings.zalo || "");
    setZaloQr(settings.zaloQr || "");
  }, [settings.zalo, settings.zaloQr]);
  return (
    <div className="settings-layout">
      <form
        className="admin-panel settings-form"
        key={JSON.stringify(settings)}
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy || uploading) return;
          setBusy(true);
          const values = Object.fromEntries(
            Array.from(new FormData(event.currentTarget), ([key, value]) => [
              key,
              String(value),
            ]),
          );
          const result = await onSave({
            ...settings,
            ...values,
            zalo: zalo.trim(),
            zaloQr,
          });
          setBusy(false);
          if (result.ok) {
            setError("");
            onMessage("Đã cập nhật thông tin trên giao diện website.");
          } else setError(result.error);
        }}
      >
        <div className="panel-heading">
          <div>
            <h2>Thông tin liên hệ</h2>
            <p>Nhập thông tin cơ sở đã được xác nhận.</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            Số điện thoại
            <input
              name="phone"
              type="tel"
              defaultValue={settings.phone}
              placeholder="Số điện thoại liên hệ"
              maxLength={18}
              pattern="[+0-9 .()-]{9,18}"
            />
          </label>
          <label>
            Email
            <input
              name="email"
              type="email"
              defaultValue={settings.email}
              placeholder="Email liên hệ"
              maxLength={150}
            />
          </label>
          <div className="full-width">
            <label htmlFor="settings-zalo">Liên kết Zalo</label>
            <input
              id="settings-zalo"
              aria-describedby="settings-zalo-help"
              name="zalo"
              type="url"
              value={zalo}
              onChange={(event) => setZalo(event.target.value)}
              placeholder="https://zalo.me/..."
              pattern="https://zalo\.me/.*"
              maxLength={250}
            />
            <p className="field-help" id="settings-zalo-help">
              Khách bấm nút Zalo trên website để quét QR hoặc mở cuộc trò
              chuyện.
            </p>
          </div>
          <div className="full-width zalo-settings">
            <label htmlFor="zalo-qr-upload">Ảnh QR Zalo (không bắt buộc)</label>
            <p className="field-help">
              Tải mã QR từ hồ sơ Zalo của cơ sở. Nếu để trống, website tự tạo QR
              từ liên kết Zalo ở trên.
            </p>
            <input
              id="zalo-qr-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading || busy}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (
                  !["image/jpeg", "image/png", "image/webp"].includes(
                    file.type,
                  ) ||
                  file.size > 8 * 1024 * 1024
                ) {
                  setError("Chọn ảnh QR JPG, PNG hoặc WebP không quá 8 MB.");
                  return;
                }
                setUploading(true);
                setError("");
                const result = await uploadImage(
                  file,
                  "Mã QR Zalo của cơ sở Thanh Phong",
                );
                if (result.ok) setZaloQr(result.url);
                else setError(result.error);
                setUploading(false);
              }}
            />
            {uploading && <p role="status">Đang tải ảnh QR…</p>}
            {(zaloQr ||
              /^https:\/\/zalo\.me\/[a-zA-Z0-9_+.-]+$/.test(zalo)) && (
              <div className="zalo-settings-preview">
                <ZaloQrCode url={zalo} image={zaloQr} />
                {zaloQr && (
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => setZaloQr("")}
                  >
                    Gỡ ảnh QR đã chọn
                  </button>
                )}
              </div>
            )}
            <p className="field-help">
              Bấm “Lưu thông tin” để cập nhật khung Zalo trên website.
            </p>
          </div>
          <div className="full-width">
            <label htmlFor="settings-tawk">Chat trực tiếp tawk.to</label>
            <input
              id="settings-tawk"
              name="tawkDirectChatUrl"
              type="url"
              defaultValue={settings.tawkDirectChatUrl}
              placeholder="https://tawk.to/chat/PropertyID/WidgetID"
              maxLength={250}
              aria-describedby="settings-tawk-help"
            />
            <p className="field-help" id="settings-tawk-help">
              Trong tawk.to, vào Administration → Channels → Chat Widget và sao
              chép Direct Chat Link. Khách bấm “Chat tư vấn” để nhắn với bạn. Để
              trống để dùng form tư vấn.
            </p>
          </div>
          <label className="full-width">
            Địa chỉ cơ sở
            <textarea
              name="address"
              defaultValue={settings.address}
              placeholder="Địa chỉ hiển thị trên trang liên hệ"
              rows={3}
              maxLength={400}
            />
          </label>
          <label className="full-width">
            Liên kết vị trí Google Maps
            <input
              name="mapUrl"
              type="url"
              defaultValue={settings.mapUrl}
              maxLength={2000}
              placeholder="https://maps.app.goo.gl/..."
            />
          </label>
          <label className="full-width">
            URL nhúng Google Maps
            <textarea
              name="mapEmbedUrl"
              defaultValue={settings.mapEmbedUrl}
              rows={3}
              maxLength={4000}
              placeholder="https://www.google.com/maps/embed?pb=..."
            />
            <span className="field-help">
              Dán phần src trong mã nhúng Google Maps. Khi đổi vị trí cơ sở, cập
              nhật cả hai liên kết này.
            </span>
          </label>
          <label className="full-width">
            Thời gian tư vấn
            <input
              name="hours"
              defaultValue={settings.hours}
              placeholder="Giờ làm việc hoặc lịch tư vấn"
              maxLength={150}
            />
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          className="button button-primary"
          disabled={busy || uploading}
        >
          {busy ? "Đang lưu…" : "Lưu thông tin"} <Icon name="check" size={16} />
        </button>
      </form>
      <aside className="admin-panel settings-info">
        <Icon name="shield" size={28} />
        <h2>Dữ liệu được lưu trên máy chủ</h2>
        <p>
          Thông tin liên hệ và nội dung được lưu trong PostgreSQL, dùng chung
          giữa các thiết bị đã đăng nhập.
        </p>
        <Link href="/policies/privacy" className="text-link">
          Thông tin xử lý dữ liệu <Icon name="arrow" size={16} />
        </Link>
        <hr />
        <h3>Thông báo yêu cầu mới</h3>
        <p>
          {notificationConfigured
            ? "Email đã được cấu hình. Tác vụ nền xử lý thông báo sau khi lưu yêu cầu."
            : "Chưa cấu hình email thông báo. Yêu cầu vẫn được lưu đầy đủ và xem trong mục Yêu cầu tư vấn."}
        </p>
      </aside>
    </div>
  );
}
