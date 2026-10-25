import Image from "next/image";
import {
  Breadcrumb,
  PageHeading,
  ConsultationCTA,
} from "@/frontend/presentation/shared/Shared";
import AboutStory from "@/frontend/presentation/website/AboutStory";
import AboutProcess from "@/frontend/presentation/website/AboutProcess";
export const metadata = { title: "Về Thanh Phong" };
export default function AboutPage() {
  return (
    <>
      <div className="page-top">
        <Breadcrumb items={[{ label: "Giới thiệu" }]} />
        <PageHeading
          eyebrow="THANH PHONG · ALUMINUM & GLASS"
          title="Từ những ô cửa, mở ra tổ ấm."
          description="Một hướng nhìn về nhôm kính: hài hòa với kiến trúc, gần gũi với cách bạn sống."
        />
      </div>
      <section className="container about-wide-image">
        <Image
          src="/images/hero-house.jpg"
          alt="Không gian sống với cửa kính — hình minh họa"
          fill
          priority
          sizes="100vw"
        />
        <span>Ánh sáng. Đường nét. Không gian.</span>
      </section>
      <AboutStory />
      <AboutProcess />
      <ConsultationCTA />
    </>
  );
}
