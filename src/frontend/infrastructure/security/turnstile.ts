import { CONSULTATION_ACTION } from "@/domain/form-protection";
import type { FormChallengeGateway } from "@/frontend/application/ports";

type Turnstile = {
  ready(callback: () => void): void;
  render(element: HTMLElement, options: Record<string, unknown>): string;
  remove(widget: string): void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}
let loading: Promise<Turnstile> | null = null;

function load() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (loading) return loading;
  loading = new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.nonce =
      document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce || "";
    const timer = window.setTimeout(failed, 15000);
    function failed() {
      window.clearTimeout(timer);
      script.onload = null;
      script.onerror = null;
      script.remove();
      reject(new Error("Verification unavailable"));
    }
    script.onerror = failed;
    script.onload = () => {
      const api = window.turnstile;
      if (!api) return failed();
      api.ready(() => {
        window.clearTimeout(timer);
        script.onload = null;
        script.onerror = null;
        resolve(api);
      });
    };
    document.head.appendChild(script);
  });
  void loading.catch(() => {
    loading = null;
  });
  return loading;
}

export const formChallengeGateway: FormChallengeGateway = {
  async render(elementId, siteKey, onToken, onError) {
    const api = await load();
    const element = document.getElementById(elementId);
    if (!element?.isConnected) return () => {};
    const widget = api.render(element, {
      sitekey: siteKey,
      action: CONSULTATION_ACTION,
      language: "vi",
      theme: "light",
      size: "flexible",
      "response-field": false,
      callback: onToken,
      "expired-callback": () => {
        onToken("");
        onError();
      },
      "timeout-callback": () => {
        onToken("");
        onError();
      },
      "error-callback": () => {
        onToken("");
        onError();
        return true;
      },
    });
    return () => api.remove(widget);
  },
};
