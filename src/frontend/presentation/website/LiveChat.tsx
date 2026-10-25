"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { chatService } from "@/frontend/composition/services";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";

export default function LiveChat() {
  const { settings } = useSite();
  const link = settings.tawkDirectChatUrl;
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => () => chatService.hide(), [link]);

  if (!link)
    return (
      <Link
        href="/quotation"
        className="floating-consult"
        aria-label="Yêu cầu tư vấn"
      >
        <Icon name="message" size={22} />
        <span>Tư vấn cho bạn</span>
      </Link>
    );

  return (
    <>
      <button
        type="button"
        className="floating-consult"
        aria-label={status === "loading" ? "Đang mở chat" : "Chat tư vấn"}
        aria-busy={status === "loading"}
        disabled={status === "loading"}
        onClick={async () => {
          setStatus("loading");
          try {
            await chatService.open(link);
            setStatus("idle");
          } catch {
            setStatus("error");
          }
        }}
      >
        <Icon name="message" size={22} />
        <span>{status === "loading" ? "Đang mở chat…" : "Chat tư vấn"}</span>
      </button>
      {status === "error" && (
        <div className="live-chat-error" role="alert">
          <button
            type="button"
            className="icon-button"
            aria-label="Đóng thông báo chat"
            onClick={() => setStatus("idle")}
          >
            <Icon name="close" size={18} />
          </button>
          <p>Chưa mở được khung chat. Bạn có thể:</p>
          <a href={link} target="_blank" rel="noopener noreferrer">
            Mở chat trực tiếp <Icon name="diagonal" size={15} />
          </a>
          <Link href="/quotation">Gửi yêu cầu tư vấn</Link>
        </div>
      )}
    </>
  );
}
