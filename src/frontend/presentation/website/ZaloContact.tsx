"use client";
import type { Settings } from "@/domain/models";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Icon from "@/frontend/presentation/shared/Icon";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";

export function ZaloQrCode({ url, image }: { url: string; image?: string }) {
  const [generated, setGenerated] = useState<{
    url: string;
    src: string;
  } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setFailed(false);
    if (!url || image) return;
    QRCode.toDataURL(url, { width: 320, margin: 4, errorCorrectionLevel: "M" })
      .then((src) => {
        if (active) setGenerated({ url, src });
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [url, image]);
  const src = image || (generated?.url === url ? generated.src : "");
  if (!url && !image) return null;
  return src ? (
    <img
      className="zalo-qr-image"
      src={src}
      alt="Mã QR kết nối Zalo với Thanh Phong"
      width={256}
      height={256}
    />
  ) : (
    <p role="status">
      {failed
        ? "Chưa tạo được mã QR. Bạn có thể mở Zalo bằng nút bên dưới."
        : "Đang tạo mã QR…"}
    </p>
  );
}

function ZaloDialog({
  settings,
  onClose,
}: {
  settings: Settings;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
      dialog.close();
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="zalo-dialog"
      aria-labelledby="zalo-dialog-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      <button
        className="icon-button zalo-close"
        type="button"
        aria-label="Đóng mã QR Zalo"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      <span className="zalo-wordmark">Zalo</span>
      <h2 id="zalo-dialog-title">Kết nối với {settings.name}</h2>
      <p>Mở Zalo, quét mã QR để kết bạn và gửi tin nhắn cho cơ&nbsp;sở.</p>
      <ZaloQrCode url={settings.zalo} image={settings.zaloQr} />
      {settings.zalo && (
        <a
          className="button zalo-message"
          href={settings.zalo}
          target="_blank"
          rel="noopener noreferrer"
        >
          Nhắn tin qua Zalo <Icon name="diagonal" size={17} />
        </a>
      )}
      {settings.zalo && (
        <small>Đang dùng điện thoại? Bấm nút trên để mở Zalo.</small>
      )}
    </dialog>
  );
}

export default function ZaloContact({ inline = false }) {
  const { settings } = useSite();
  const [open, setOpen] = useState(false);
  const validLink = /^https:\/\/zalo\.me\/[a-zA-Z0-9_+.-]+$/.test(
    settings.zalo,
  );
  if (!validLink && !settings.zaloQr) return null;
  return (
    <>
      <button
        type="button"
        className={inline ? "text-link zalo-inline" : "floating-zalo"}
        aria-label={inline ? "Quét QR kết bạn Zalo" : "Mở mã QR Zalo"}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
      >
        <span className="zalo-wordmark">Zalo</span>
        {inline && <span>Quét QR kết bạn Zalo</span>}
        {!inline && (
          <span className="contact-action-label" aria-hidden="true">
            Nhắn qua Zalo
          </span>
        )}
      </button>
      {open && (
        <ZaloDialog
          settings={{ ...settings, zalo: validLink ? settings.zalo : "" }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
