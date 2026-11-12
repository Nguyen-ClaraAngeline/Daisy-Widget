import type { State } from "../hooks/bookingReducer";
import { formatDay, formatPrice, formatTime } from "../utils/formats";
import { MSG } from "../utils/messages";

export function Confirmation({ state }: { state: State }) {
  const tz = state.studio?.timezone ?? "Europe/Paris";
  return (
    <>
      <h2>C'est réservé !</h2>
      <div className="dw-banner ok" role="status">{MSG.confirmed(state.booking?.code ?? "")}</div>
      {state.slot && (
        <p>
          {state.course?.name}, {formatDay(state.slot.startsAt, tz)} à {formatTime(state.slot.startsAt, tz)}
          {" · "}{state.seats} place{state.seats > 1 ? "s" : ""}
          {state.booking && ` · ${formatPrice(state.booking.totalCents, state.studio?.currency)}`}
        </p>
      )}
    </>
  );
}