import { createRoot } from "react-dom/client";
import { Widget } from "../src/components/widget";
import { ErrorBoundary } from "../src/components/errorBoundary";
import { buildStyles } from "../src/styles";
import type { WidgetConfig } from "../src/types";

const DEFAULT_API = "https://api.daisy.example/public/v1";

const IS_LOCAL = ["localhost", "127.0.0.1"].includes(location.hostname);

function mount(host: HTMLElement) {
  if (host.dataset.daisyMounted) return;
  const studioKey = host.dataset.studio;
  if (!studioKey) return console.error("[daisy] data-studio manquant sur #daisy-booking");
  host.dataset.daisyMounted = "1";

  const config: WidgetConfig = {
    studioKey,
    apiBase: IS_LOCAL && host.dataset.api ? host.dataset.api : DEFAULT_API,
    radius: host.dataset.radius,
    font: host.dataset.font,
  };

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
  const css = buildStyles();
  if ("adoptedStyleSheets" in shadow && typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
  } else {
    const style = document.createElement("style");
    style.textContent = css;
    shadow.append(style);
  }
  const root = document.createElement("div");
  shadow.append(root);
  createRoot(root).render(
    <ErrorBoundary>
      <Widget config={config} />
    </ErrorBoundary>,
  );
}

function scan() {
  const host = document.getElementById("daisy-booking");
  if (host) mount(host);
  return !!host;
}
function start() {
  if (scan()) return;
  const obs = new MutationObserver(() => { if (scan()) obs.disconnect(); });
  obs.observe(document.documentElement, { childList: true, subtree: true });
  setTimeout(() => obs.disconnect(), 15000);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();