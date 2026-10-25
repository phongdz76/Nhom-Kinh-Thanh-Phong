"use client";
import type { Article, Project, ContentKind } from "@/domain/models";
import { useEffect, useRef, useState } from "react";
import { postSchema, projectSchema } from "@/domain/schemas";
import type { CategoryInput } from "@/domain/models";
import Link from "next/link";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";

type ContentDocument = Pick<
  Article,
  "id" | "title" | "category" | "image" | "status"
> &
  Partial<
    Pick<Article, "slug" | "intro" | "time" | "sections"> &
      Pick<Project, "type" | "description" | "products">
  >;
type EditorState = { kind: ContentKind; document: ContentDocument | null };
function Editor({
  kind,
  document,
  onClose,
}: EditorState & { onClose: () => void }) {
  const { saveContent, uploadImage, products } = useSite();
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(
    document?.image || products[0]?.image || "/images/hero-house.jpg",
  );
  const [sections, setSections] = useState(
    document?.sections || [{ title: "", text: "" }],
  );
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const post = kind === "posts";
  return (
    <dialog
      ref={ref}
      className="admin-dialog dialog-wide"
      onCancel={onClose}
      aria-label={post ? "Biên tập bài viết" : "Biên tập công trình"}
    >
      <div className="dialog-heading">
        <h2>{post ? "Biên tập bài viết" : "Biên tập công trình"}</h2>
        <button
          type="button"
          className="icon-button"
          onClick={onClose}
          aria-label="Đóng cửa sổ"
        >
          <Icon name="close" />
        </button>
      </div>
      <form
        className="editor-form"
        onSubmit={async (event) => {
          event.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          const form = new FormData(event.currentTarget);
          const common = {
            slug: String(form.get("slug")),
            title: String(form.get("title")),
            category: String(form.get("category")),
            image,
            status: String(form.get("status")),
          };
          const data = post
            ? {
                ...common,
                intro: String(form.get("summary")),
                time: String(form.get("time")),
                sections,
              }
            : {
                ...common,
                type: String(form.get("type")),
                description: String(form.get("summary")),
                images: [image],
                products: form.getAll("products").map(String),
              };
          const parsed =
            kind === "posts"
              ? postSchema.safeParse(data)
              : projectSchema.safeParse(data);
          if (!parsed.success) {
            setError(parsed.error.issues[0].message);
            setBusy(false);
            return;
          }
          const result = await saveContent(kind, parsed.data);
          if (result.ok) onClose();
          else {
            setError(result.error);
            setBusy(false);
          }
        }}
      >
        <div className="form-grid">
          <label className="full-width">
            Tiêu đề
            <input
              name="title"
              required
              maxLength={180}
              defaultValue={document?.title}
            />
          </label>
          <label>
            Đường dẫn không dấu
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={120}
              defaultValue={document?.slug || document?.id || ""}
              readOnly={Boolean(document)}
            />
          </label>
          <label>
            Trạng thái
            <select name="status" defaultValue={document?.status || "draft"}>
              <option value="draft">Bản nháp</option>
              <option value="published">Xuất bản</option>
            </select>
          </label>
          <label>
            Nhóm nội dung
            {post ? (
              <input
                name="category"
                required
                maxLength={100}
                defaultValue={document?.category}
              />
            ) : (
              <select
                name="category"
                defaultValue={document?.category || "house"}
              >
                <option value="house">Nhà phố</option>
                <option value="villa">Biệt thự</option>
                <option value="interior">Nội thất</option>
                <option value="other">Khác</option>
              </select>
            )}
          </label>
          {post ? (
            <label>
              Thời gian đọc
              <input
                name="time"
                maxLength={40}
                defaultValue={document?.time || "3 phút đọc"}
              />
            </label>
          ) : (
            <label>
              Loại công trình
              <input
                name="type"
                maxLength={100}
                required
                defaultValue={document?.type}
                placeholder="Nhà phố, biệt thự..."
              />
            </label>
          )}
          <label className="full-width">
            {post ? "Mở đầu bài viết" : "Mô tả công trình"}
            <textarea
              name="summary"
              required
              rows={3}
              maxLength={post ? 1000 : 3000}
              defaultValue={document?.intro || document?.description}
            />
          </label>
          <div className="full-width content-image-picker">
            <img src={image} alt="Ảnh đại diện nội dung" />
            <label className="button button-outline">
              <Icon name="upload" size={17} />
              Tải ảnh đại diện
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setBusy(true);
                  const result = await uploadImage(
                    file,
                    document?.title || file.name,
                  );
                  if (result.ok) setImage(result.url);
                  else setError(result.error);
                  setBusy(false);
                }}
              />
            </label>
          </div>
          {post ? (
            <div className="full-width content-sections">
              {sections.map((section, index) => (
                <fieldset key={index}>
                  <legend>Phần {index + 1}</legend>
                  <label>
                    Tiêu đề phần
                    <input
                      required
                      maxLength={180}
                      value={section.title}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, title: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  <label>
                    Nội dung
                    <textarea
                      required
                      rows={5}
                      maxLength={10000}
                      value={section.text}
                      onChange={(event) =>
                        setSections((current) =>
                          current.map((item, i) =>
                            i === index
                              ? { ...item, text: event.target.value }
                              : item,
                          ),
                        )
                      }
                    />
                  </label>
                  {sections.length > 1 && (
                    <button
                      type="button"
                      className="text-link"
                      onClick={() =>
                        setSections((current) =>
                          current.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Bỏ phần này
                    </button>
                  )}
                </fieldset>
              ))}
              <button
                type="button"
                className="button button-outline"
                onClick={() =>
                  setSections((current) => [
                    ...current,
                    { title: "", text: "" },
                  ])
                }
                disabled={sections.length >= 30}
              >
                <Icon name="plus" size={16} />
                Thêm phần nội dung
              </button>
            </div>
          ) : (
            <fieldset className="full-width related-product-picker">
              <legend>Sản phẩm liên quan</legend>
              {products.map((product) => (
                <label key={product.id}>
                  <input
                    type="checkbox"
                    name="products"
                    value={product.id}
                    defaultChecked={document?.products?.includes(product.id)}
                  />
                  {product.name}
                </label>
              ))}
            </fieldset>
          )}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <span>Giữ nguyên đường dẫn của nội dung đã có.</span>
          <button
            className="button button-outline"
            type="button"
            onClick={onClose}
          >
            Hủy
          </button>
          <button className="button button-primary" disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu nội dung"}
            <Icon name="check" size={16} />
          </button>
        </div>
      </form>
    </dialog>
  );
}
export default function ContentManager() {
  const { articles, projects, categories, user, saveCategory } = useSite();
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [category, setCategory] = useState<CategoryInput | null>(null);
  const [message, setMessage] = useState("");
  return (
    <>
      {user?.role === "owner" && (
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <h2>Danh mục sản phẩm</h2>
              <p>Tắt danh mục để ẩn toàn bộ mẫu thuộc nhóm đó khỏi website.</p>
            </div>
            <button
              className="button button-outline"
              onClick={() =>
                setCategory({
                  key: "",
                  name: "",
                  icon: "door",
                  sortOrder: categories.length,
                  isActive: true,
                })
              }
            >
              <Icon name="plus" size={16} />
              Thêm danh mục
            </button>
          </div>
          <div className="content-category-list">
            {categories
              .filter((item) => item.id !== "all")
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setMessage("");
                    setCategory({
                      key: item.id,
                      name: item.name,
                      icon: item.icon,
                      sortOrder: item.sortOrder,
                      isActive: item.isActive,
                    });
                  }}
                >
                  <Icon name={item.icon} size={19} />
                  <span>{item.name}</span>
                  <span
                    className={`badge ${item.isActive ? "badge-green" : "badge-gold"}`}
                  >
                    {item.isActive ? "Đang hoạt động" : "Đã ẩn"}
                  </span>
                  <Icon name="edit" size={15} />
                </button>
              ))}
          </div>
          {category && (
            <form
              className="category-editor form-grid"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const result = await saveCategory({
                  key: String(form.get("key")),
                  name: String(form.get("name")),
                  icon: String(form.get("icon")) as CategoryInput["icon"],
                  sortOrder: Number(form.get("sortOrder")),
                  isActive: form.get("isActive") === "on",
                });
                if (result.ok) {
                  setCategory(null);
                  setMessage("Đã lưu danh mục.");
                } else setMessage(result.error);
              }}
              key={category.key}
            >
              <label>
                Mã danh mục
                <input
                  name="key"
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  defaultValue={category.key}
                  readOnly={Boolean(category.key)}
                />
              </label>
              <label>
                Tên danh mục
                <input
                  name="name"
                  required
                  maxLength={100}
                  defaultValue={category.name}
                />
              </label>
              <label>
                Biểu tượng
                <select name="icon" defaultValue={category.icon}>
                  {["door", "window", "layers", "railing", "roof", "grid"].map(
                    (icon) => (
                      <option key={icon}>{icon}</option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Thứ tự
                <input
                  name="sortOrder"
                  type="number"
                  min="0"
                  max="10000"
                  defaultValue={category.sortOrder}
                />
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={category.isActive}
                />
                Hiển thị danh mục
              </label>
              <div className="button-row">
                <button className="button button-primary">Lưu danh mục</button>
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => setCategory(null)}
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
          {message && (
            <p className="content-status" role="status">
              {message}
            </p>
          )}
        </section>
      )}
      {(
        [
          ["posts", "Cẩm nang & bài viết", articles],
          ["projects", "Công trình & album", projects],
        ] satisfies [ContentKind, string, ContentDocument[]][]
      ).map(([kind, title, documents]) => (
        <section className="admin-panel" key={kind}>
          <div className="panel-heading">
            <div>
              <h2>{title}</h2>
              <p>Chỉ nội dung đã xuất bản hiển thị trên website.</p>
            </div>
            <button
              className="button button-outline"
              onClick={() => setEditor({ kind, document: null })}
            >
              <Icon name="plus" size={16} />
              {kind === "posts" ? "Thêm bài viết" : "Thêm công trình"}
            </button>
          </div>
          <div className="content-list">
            {documents.map((document) => (
              <div
                className="managed-content-row"
                key={"slug" in document ? document.slug : document.id}
              >
                <img src={document.image} alt="" />
                <div>
                  <span>{document.category}</span>
                  <h3>{document.title}</h3>
                  <span
                    className={`badge ${document.status === "published" ? "badge-green" : "badge-gold"}`}
                  >
                    {document.status === "published"
                      ? "Đã xuất bản"
                      : "Bản nháp"}
                  </span>
                </div>
                <button
                  className="button button-outline"
                  onClick={() => setEditor({ kind, document })}
                >
                  <Icon name="edit" size={15} />
                  Chỉnh sửa
                </button>
                {document.status === "published" && (
                  <Link
                    href={`/${kind === "posts" ? "news" : "projects"}/${"slug" in document ? document.slug : document.id}`}
                    className="icon-button"
                    aria-label={`Xem ${document.title}`}
                  >
                    <Icon name="diagonal" size={18} />
                  </Link>
                )}
              </div>
            ))}
          </div>
          {!documents.length && (
            <p className="content-status">
              Chưa có nội dung. Thêm một bản nháp để bắt đầu.
            </p>
          )}
        </section>
      ))}
      {editor && <Editor {...editor} onClose={() => setEditor(null)} />}
    </>
  );
}
