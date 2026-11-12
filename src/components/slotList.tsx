import type { State } from "../hooks/bookingReducer";
import type { Slot } from "../types";
import { formatDay, formatPrice, formatTime } from "../utils/formats";
import { MSG } from "../utils/messages";
import { Loading } from "./statusViews";

function notice(n: NonNullable<State["notice"]>) {
  return n.kind === "taken" ? MSG.taken : n.kind === "cancelled" ? MSG.cancelled : MSG.reduced(n.available ?? 0);
}

export function SlotList({ state, onPick, onBack }: { state: State; onPick: (s: Slot) => void; onBack: () => void }) {
  const tz = state.studio?.timezone ?? "Europe/Paris";
  const cur = state.studio?.currency;
  const allFull = state.slots.length > 0 && state.slots.every((s) => s.seatsAvailable === 0);
  return (
    <>
      <h2>{state.course?.name}</h2>
      {state.notice && <div className="dw-banner warn" role="alert">{notice(state.notice)}</div>}
      {state.loading ? <Loading /> : (
        <>
          {!state.error && state.slots.length === 0 && <p className="muted">{MSG.noSlots}</p>}
          {allFull && <p className="muted">{MSG.courseFull}</p>}
          <ul className="dw-list">
            {state.slots.map((s) => (
              <li key={s.id}>
                <button className="dw-card" disabled={s.seatsAvailable === 0} onClick={() => onPick(s)}>
                  <span className="row">
                    <strong>{formatDay(s.startsAt, tz)} · {formatTime(s.startsAt, tz)}</strong>
                    <span>{formatPrice(s.priceCents, cur)}</span>
                  </span>
                  <span className="muted">{s.seatsAvailable === 0 ? MSG.slotFull : MSG.remaining(s.seatsAvailable)}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="dw-actions"><button className="dw-btn ghost" onClick={onBack}>{MSG.back}</button></div>
    </>
  );
}