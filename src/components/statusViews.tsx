import { MSG } from "../utils/messages";
import type { ApiErrorKind } from "../types";

export const Loading = () => (
  <div className="dw-list" role="status" aria-label={MSG.loading}>
    <div className="dw-skel" /><div className="dw-skel" /><div className="dw-skel" />
  </div>
);

const RETRYABLE: ApiErrorKind[] = ["network", "timeout", "server", "uncertain"];

export const ErrorBanner = ({ kind, onRetry }: { kind: ApiErrorKind; onRetry: () => void }) => (
  <div className="dw-banner error" role="alert">
    <p>{MSG.errors[kind]}</p>
    {RETRYABLE.includes(kind) && <button className="dw-btn ghost" onClick={onRetry}>{MSG.retry}</button>}
  </div>
);