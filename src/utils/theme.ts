import type { CSSProperties } from "react";
import type { WidgetConfig } from "../types";

// Customisation : la couleur vient du back-office (GET /studio), le reste est une liste fermée.
const RADII: Record<string, string> = { none: "0px", soft: "8px", round: "16px" };
const FONTS: Record<string, string> = {
  inherit: "inherit",
  sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
};
const DEFAULT_PRIMARY = "#b45309";
const DARK = "#1c1917";
const AA = 4.5;

const isHex = (v?: string): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);

function channel(hex: string, start: number) {
  const v = parseInt(hex.slice(start, start + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function luminance(hex: string) {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}
const contrast = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function darken(hex: string, k: number) {
  const c = (i: number) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, "0");
  return `#${c(1)}${c(3)}${c(5)}`;
}

export function pickColors(input: string) {
  const dark = luminance(DARK);
  const L = luminance(input);
  const white = contrast(L, 1);
  const black = contrast(L, dark);
  if (Math.max(white, black) >= AA) {
    return { primary: input, onPrimary: white >= black ? "#ffffff" : DARK };
  }
  let primary = input;
  for (let k = 0.05; k <= 0.6 && contrast(luminance(primary), 1) < AA; k += 0.05) primary = darken(input, k);
  return { primary, onPrimary: "#ffffff" };
}

export function themeStyle(primaryColor: string | undefined, cfg: Pick<WidgetConfig, "radius" | "font">): CSSProperties {
  const { primary, onPrimary } = pickColors(isHex(primaryColor) ? primaryColor : DEFAULT_PRIMARY);
  return {
    "--dw-primary": primary,
    "--dw-on-primary": onPrimary,
    "--dw-radius": RADII[cfg.radius ?? "soft"] ?? RADII.soft,
    "--dw-font": FONTS[cfg.font ?? "sans"] ?? FONTS.sans,
  } as CSSProperties;
}