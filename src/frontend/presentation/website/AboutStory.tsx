import Image from "next/image";
import Link from "next/link";
import Icon from "@/frontend/presentation/shared/Icon";

const values = [
  {
    number: "01",
    title: "Hài hòa với kiến trúc",
    text: "Tỷ lệ và đường nét được cân nhắc cùng tổng thể ngôi nhà.",
  },
  {
    number: "02",
    title: "Phù hợp cách sử dụng",
    text: "Vật liệu, phụ kiện và cách mở bắt đầu từ nhu cầu thực tế.",
  },
  {
    number: "03",
    title: "Rõ ràng trong trao đổi",
    text: "Cùng làm rõ cấu hình và phương án trước khi bắt đầu.",
  },
];

export default function AboutStory() {
  return (
    <section className="about-story" aria-labelledby="about-story-title">
      <div className="container">
        <div className="about-story-layout">
          <figure className="about-story-visual">
            <div className="about-story-image">
              <Image
                src="/images/sliding-door.jpg"
                alt="Ánh sáng qua khung cửa kính trong phòng khách — ảnh không gian minh họa"
                fill
                sizes="(max-width: 760px) calc(100vw - 48px), (max-width: 1100px) 44vw, 540px"
              />
            </div>
          </figure>

          <div className="about-story-copy">
            <span className="eyebrow about-story-eyebrow">
              TINH THẦN THANH PHONG
            </span>
            <h2 id="about-story-title">
              Đường nét tinh gọn.<span>Lựa chọn có chủ đích.</span>
            </h2>
            <p className="about-story-lead">
              Một ô cửa đẹp không chỉ để nhìn. Đó còn là cách đón ánh sáng, mở
              rộng tầm nhìn và kết nối những sinh hoạt mỗi ngày.
            </p>
            <p className="about-story-description">
              Với Thanh Phong, mỗi phương án bắt đầu từ cách bạn sử dụng không
              gian. Cùng trao đổi về vật liệu, cách mở và từng chi tiết để tìm
              lựa chọn phù hợp cho ngôi nhà.
            </p>
            <div className="about-story-actions">
              <Link href="/products" className="about-story-explore">
                Khám phá các giải pháp
                <Icon name="arrow" size={19} />
              </Link>
              <span className="about-story-signature">
                THANH PHONG<span>Nhôm kính cho không gian sống</span>
              </span>
            </div>
          </div>
        </div>

        <ul
          className="about-story-values"
          aria-label="Định hướng của Thanh Phong"
        >
          {values.map((value) => (
            <li key={value.number} className="about-story-value">
              <span className="about-story-value-number" aria-hidden="true">
                {value.number}
              </span>
              <div>
                <h3>{value.title}</h3>
                <p>{value.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
