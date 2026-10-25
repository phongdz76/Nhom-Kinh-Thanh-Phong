import Link from "next/link";
import Icon from "@/frontend/presentation/shared/Icon";
export default function NotFound() {
  return (
    <div className="not-found container">
      <span className="eyebrow">404 · CHƯA TÌM THẤY KHÔNG GIAN NÀY</span>
      <h1>
        Có lẽ bạn đã mở
        <br />
        nhầm một ô cửa.
      </h1>
      <p>Trang bạn tìm chưa có hoặc đường dẫn đã thay đổi.</p>
      <Link href="/products" className="button button-primary">
        Khám phá sản phẩm <Icon name="arrow" size={18} />
      </Link>
    </div>
  );
}
