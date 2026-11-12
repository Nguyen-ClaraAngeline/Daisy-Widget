import { createRoot } from "react-dom/client";
import { Widget } from "../src/components/widget";
import { buildStyles } from "../src/styles";
import type { WidgetConfig } from "../src/types";

const DEFAULT_API = "https://api.daisy.example/public/v1";

function mount() {
  const host = document.getElementById("daisy-booking");
  if (!host || host.dataset.daisyMounted) return;
  const studioKey = host.dataset.studio;
  if (!studioKey) return console.error("[daisy] data-studio manquant sur #daisy-booking");
  host.dataset.daisyMounted = "1";

  const config: WidgetConfig = {
    studioKey,
    apiBase: host.dataset.api ?? DEFAULT_API, // data-api : surcharge pour dev/mock uniquement
    radius: host.dataset.radius,
    font: host.dataset.font,
  };

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = buildStyles();
  const root = document.createElement("div");
  shadow.append(style, root);
  createRoot(root).render(<Widget config={config} />);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount);
else mount();