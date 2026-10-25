"use client";
import { Suspense } from "react";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";
import ConsultationForm from "@/frontend/presentation/website/ConsultationForm";
import ZaloContact from "@/frontend/presentation/website/ZaloContact";
import { getMapLocation } from "@/frontend/presentation/shared/map-links";
export default function ContactContent() {
  const { settings } = useSite();
  const location = getMapLocation(settings.address, settings);
  return (
    <>
      <div className="container contact-layout">
        <aside className="contact-copy">
          <span className="eyebrow">THANH PHONG LẮNG NGHE</span>
          <h2>
            Ngôi nhà của bạn
            <br />
            bắt đầu từ ý tưởng.
          </h2>
          <p>
            Bạn đã có bản vẽ, một mẫu cửa yêu thích, hay chỉ vừa bắt đầu tìm
            hiểu? Hãy chia sẻ điều bạn đang hình dung.
          </p>
          <div className="contact-methods">
            <div>
              <Icon name="phone" size={23} />
              <div>
                <h3>Điện thoại & Zalo</h3>
                {settings.phone ? (
                  <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
                    {settings.phone}
                  </a>
                ) : (
                  <p>Thông tin đang được cập nhật</p>
                )}
                <ZaloContact inline />
              </div>
            </div>
            <div>
              <Icon name="location" size={23} />
              <div>
                <h3>Địa chỉ cơ sở</h3>
                {location ? (
                  <a
                    href={location.searchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="contact-address-link"
                    title="Mở Google Maps chỉ đường"
                  >
                    {location.address} <Icon name="diagonal" size={13} />
                  </a>
                ) : (
                  <p>Sẽ cập nhật sau khi xác nhận thông tin cơ sở.</p>
                )}
              </div>
            </div>
            <div>
              <Icon name="mail" size={23} />
              <div>
                <h3>Email</h3>
                {settings.email ? (
                  <a href={`mailto:${settings.email}`}>{settings.email}</a>
                ) : (
                  <p>Thông tin đang được cập nhật</p>
                )}
              </div>
            </div>
            <div>
              <Icon name="clock" size={23} />
              <div>
                <h3>Thời gian tư vấn</h3>
                <p>{settings.hours}</p>
              </div>
            </div>
          </div>
          <div className="contact-image">
            <img
              src="/images/sliding-door.jpg"
              alt="Không gian sống minh họa với cửa kính đón sáng"
            />
            <span>Mỗi góc nhà, một câu chuyện riêng.</span>
          </div>
        </aside>
        <Suspense
          fallback={<div className="empty-state">Đang mở form tư vấn...</div>}
        >
          <ConsultationForm />
        </Suspense>
      </div>
      {location && (
        <div className="container contact-map-wrapper">
          <div className="contact-map-card">
            <div className="contact-map-info">
              <span className="eyebrow">CHỈ ĐƯỜNG TẬN NƠI</span>
              <h2>Vị trí xưởng Nhôm Kính Thanh Phong</h2>
              <p>{location.address}</p>
              <a
                href={location.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
              >
                Mở trong Google Maps <Icon name="diagonal" size={16} />
              </a>
            </div>
            <div className="contact-map-iframe-container">
              <iframe
                src={location.embedUrl}
                width="100%"
                height="380"
                style={{ border: 0, borderRadius: "14px" }}
                allowFullScreen={true}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ chỉ đường tới xưởng Nhôm Kính Thanh Phong"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
