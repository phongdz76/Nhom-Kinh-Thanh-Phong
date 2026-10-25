import Image from "next/image";
import logo from "@/frontend/presentation/shared/assets/images/Logo.png";
export default function Brand({ light = false }) {
  return (
    <span className={`brand ${light ? "brand-light" : ""}`}>
      <span className="brand-symbol">
        <Image src={logo} alt="" width={150} height={150} priority />
      </span>
      <span className="brand-wordmark">
        <strong>THANH PHONG</strong>
        <small>ALUMINUM & GLASS</small>
      </span>
    </span>
  );
}
