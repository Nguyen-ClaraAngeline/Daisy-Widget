import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(e: unknown) { console.error("[daisy]", e); }
  render() {
    return this.state.failed
      ? <p className="dw dw-banner error" role="alert">Le module de réservation est momentanément indisponible. Contactez directement l'atelier.</p>
      : this.props.children;
  }
}