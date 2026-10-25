import type { ChatGateway } from "@/frontend/application/ports";

type TawkApi = {
  onLoad?: () => void;
  onBeforeLoad?: () => void;
  onChatMinimized?: () => void;
  showWidget?: () => void;
  hideWidget?: () => void;
  maximize?: () => void;
  shutdown?: () => void;
  start?: (options: { showWidget: boolean }) => void;
  switchWidget?: (
    widget: { propertyId: string; widgetId: string },
    callback: (error?: unknown) => void,
  ) => void;
};
type TawkWindow = Window & {
  Tawk_API?: TawkApi;
  Tawk_LoadStart?: Date;
};

const timeoutMs = 15000;
let loading: Promise<TawkApi> | undefined;
let activeLink = "";
let generation = 0;
let suspended = false;
const browser = () => window as TawkWindow;

function loadWidget(link: string): Promise<TawkApi> {
  if (loading) return loading;
  activeLink = link;
  const [, , propertyId, widgetId] = new URL(link).pathname.split("/");
  loading = new Promise<TawkApi>((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error("Chat could not be loaded.")),
      timeoutMs,
    );
    const api = (browser().Tawk_API ||= {});
    api.onBeforeLoad = () => browser().Tawk_API?.hideWidget?.();
    api.onChatMinimized = () => browser().Tawk_API?.hideWidget?.();
    api.onLoad = () => {
      window.clearTimeout(timer);
      const ready = browser().Tawk_API;
      if (!ready?.showWidget || !ready.maximize) {
        reject(new Error("Chat is unavailable."));
        return;
      }
      ready.hideWidget?.();
      if (suspended) ready.shutdown?.();
      resolve(ready);
    };
    browser().Tawk_LoadStart = new Date();
    const script = document.createElement("script");
    // Only IDs from the validated link are used; arbitrary script URLs/HTML
    // from settings are never executed. No API key or visitor data is sent.
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.id = "thanhphong-tawk-widget";
    script.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("Chat could not be loaded."));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export const tawkChatGateway: ChatGateway = {
  async open(link) {
    const current = ++generation;
    suspended = false;
    const api = await loadWidget(link);
    if (current !== generation) return;
    if (activeLink !== link) {
      const [, , propertyId, widgetId] = new URL(link).pathname.split("/");
      await new Promise<void>((resolve, reject) => {
        if (!api.switchWidget) {
          reject(new Error("Reload the page to use the updated chat."));
          return;
        }
        const timer = window.setTimeout(
          () => reject(new Error("Chat could not be switched.")),
          timeoutMs,
        );
        api.switchWidget({ propertyId, widgetId }, (error) => {
          window.clearTimeout(timer);
          if (error) reject(new Error("Chat could not be switched."));
          else {
            activeLink = link;
            resolve();
          }
        });
      });
    }
    if (current !== generation) return;
    api.start?.({ showWidget: false });
    api.showWidget?.();
    api.maximize?.();
  },
  hide() {
    generation++;
    suspended = true;
    browser().Tawk_API?.hideWidget?.();
    browser().Tawk_API?.shutdown?.();
  },
};
