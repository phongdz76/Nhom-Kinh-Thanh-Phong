"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { chatService } from "@/frontend/composition/services";
import { useSite } from "@/frontend/presentation/shared/SiteProvider";
import Icon from "@/frontend/presentation/shared/Icon";

function ChatWidget({ link, name }: { link: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const embed = chatService.embed(link);

  useEffect(() => {
    if (!requested) return;
    const timer = window.setTimeout(() => setStatus("error"), 20000);
    function receive(event: MessageEvent) {
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== window.location.origin ||
        !event.data ||
        typeof event.data !== "object"
      )
        return;
      if (event.data.type === "thanhphong:chat:ready") {
        window.clearTimeout(timer);
        setStatus("ready");
      } else if (event.data.type === "thanhphong:chat:error") {
        window.clearTimeout(timer);
        setStatus("error");
      }
    }
    window.addEventListener("message", receive);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, [requested, attempt]);

  useEffect(() => {
    if (!open) return;
    closeButton.current?.focus({ preventScroll: true });
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }
    }
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="floating-consult"
        aria-label="Chat tư vấn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={requested ? "live-chat-panel" : undefined}
        onClick={() => {
          setRequested(true);
          setOpen((current) => !current);
        }}
      >
        <Icon name="message" size={24} strokeWidth={1.8} />
        <span className="contact-action-label" aria-hidden="true">
          Chat trực tiếp
        </span>
      </button>
      {requested && (
        <section
          id="live-chat-panel"
          className="live-chat-panel"
          role="dialog"
          aria-labelledby="live-chat-title"
          hidden={!open}
        >
          <header className="live-chat-header">
            <span className="live-chat-symbol">
              <Icon name="message" size={24} />
            </span>
            <div className="live-chat-heading">
              <h2 id="live-chat-title">Chat tư vấn</h2>
              <p>{name}</p>
            </div>
            <button
              ref={closeButton}
              type="button"
              className="live-chat-close"
              aria-label="Đóng chat tư vấn"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
              }}
            >
              <Icon name="close" size={22} />
            </button>
          </header>
          <div className="live-chat-body" aria-busy={status === "loading"}>
            <iframe
              key={attempt}
              ref={frame}
              className="live-chat-frame"
              title="Khung trò chuyện trực tiếp"
              srcDoc={embed.document}
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() =>
                frame.current?.contentWindow?.postMessage(
                  { type: "thanhphong:chat:probe" },
                  window.location.origin,
                )
              }
            />
            {status === "loading" && (
              <div className="live-chat-loading" role="status">
                <Icon name="message" size={30} />
                <p>Đang kết nối với {name}…</p>
              </div>
            )}
            {status === "error" && (
              <div className="live-chat-unavailable" role="alert">
                <Icon name="message" size={30} />
                <p>Chưa kết nối được khung chat.</p>
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    setStatus("loading");
                    setAttempt((current) => current + 1);
                  }}
                >
                  Thử lại
                </button>
                <Link href="/quotation" className="text-link">
                  Gửi yêu cầu tư vấn
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}

export default function LiveChat() {
  const { settings } = useSite();
  return settings.tawkDirectChatUrl ? (
    <ChatWidget
      key={settings.tawkDirectChatUrl}
      link={settings.tawkDirectChatUrl}
      name={settings.name}
    />
  ) : null;
}
