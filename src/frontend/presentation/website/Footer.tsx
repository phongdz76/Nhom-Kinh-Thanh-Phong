"use client";
import Link from "next/link";
import BrandLink from "@/frontend/presentation/shared/BrandLink";
import Icon from "@/frontend/presentation/shared/Icon";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import { getMapLocation } from "@/frontend/presentation/shared/map-links";
export default function Footer() {
  const { settings } = useSite();
  const location = getMapLocation(settings.address, settings);
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandLink light />
          <p>
            Đường nét tinh gọn.
            <br />
            Không gian rộng mở.
            <br />
            Cảm hứng cho ngôi nhà của bạn.
          </p>
          <span className="footer-caption">ALUMINUM · GLASS · LIVING</span>
        </div>
        <div>
          <h3>Khám phá</h3>
          <Link href="/about">Về Thanh Phong</Link>
          <Link href="/products">Bộ sưu tập sản phẩm</Link>
          <Link href="/projects">Không gian ứng dụng</Link>
          <Link href="/news">Cẩm nang nhôm kính</Link>
        </div>
        <div>
          <h3>Giải pháp</h3>
          <Link href="/products?category=doors">Cửa nhôm kính</Link>
          <Link href="/products?category=glass">Vách & cửa kính</Link>
          <Link href="/products?category=railings">Lan can kính</Link>
          <Link href="/products?category=roofs">Mái kính lấy sáng</Link>
        </div>
        <div className="footer-contact-col">
          <h3>Cùng bắt đầu một ý tưởng</h3>
          {location && (
            <div className="footer-map-embed">
              <iframe
                src={location.embedUrl}
                width="100%"
                height="145"
                style={{ border: 0, borderRadius: "10px" }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vị trí xưởng Nhôm Kính Thanh Phong trên Google Maps"
              />
            </div>
          )}
          <div className="footer-contact-list">
            {location ? (
              <a
                href={location.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-contact-item"
                title="Mở Google Maps chỉ đường"
              >
                <Icon name="location" size={15} />
                <span>{location.address}</span>
                <Icon name="diagonal" size={11} className="map-arrow" />
              </a>
            ) : (
              <p className="footer-fallback-text">
                Chia sẻ không gian bạn muốn hoàn thiện. Thanh Phong sẽ cùng bạn
                tìm phương án phù hợp.
              </p>
            )}
            {settings.phone && (
              <a
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
                className="footer-contact-item"
              >
                <Icon name="phone" size={15} />
                <span>{settings.phone}</span>
              </a>
            )}
            {settings.email && (
              <a
                href={`mailto:${settings.email}`}
                className="footer-contact-item"
              >
                <Icon name="mail" size={15} />
                <span>{settings.email}</span>
              </a>
            )}
          </div>
          <Link href="/contact" className="footer-contact">
            Kết nối với Thanh Phong <Icon name="diagonal" size={16} />
          </Link>
        </div>
      </div>
      <div className="footer-copyright">
        <div className="container text-center">
          © 2026 Thanh Phong. Aluminum & Glass.
        </div>
      </div>
    </footer>
  );
}
