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

const isHex = (v?: string): v is string => !!v && /^#[0-9a-f]{6}$/i.test(v);

function channel(hex: string, start: number) {
  const v = parseInt(hex.slice(start, start + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function luminance(hex: string) {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

export function themeStyle(primaryColor: string | undefined, cfg: Pick<WidgetConfig, "radius" | "font">): CSSProperties {
  const primary = isHex(primaryColor) ? primaryColor : DEFAULT_PRIMARY;
  return {
    "--dw-primary": primary,
    // Contraste garanti, quelle que soit la couleur choisie
    "--dw-on-primary": luminance(primary) > 0.4 ? "#1c1917" : "#ffffff",
    "--dw-radius": RADII[cfg.radius ?? "soft"] ?? RADII.soft,
    "--dw-font": FONTS[cfg.font ?? "sans"] ?? FONTS.sans,
  } as CSSProperties;
}