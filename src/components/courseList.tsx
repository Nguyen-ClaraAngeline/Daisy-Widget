import type { State } from "../hooks/bookingReducer";
import { Loading } from "./statusViews";
import type { Course } from "../types";
import { formatDuration, formatPrice } from "../utils/formats";
import { MSG } from "../utils/messages";

export function CourseList({ state, onPick }: { state: State; onPick: (c: Course) => void }) {
  if (state.loading) return <Loading />;
  const cur = state.studio?.currency;
  return (
    <>
      <h2>Choisissez un cours</h2>
      {!state.error && state.courses.length === 0 && <p className="muted">{MSG.noCourses}</p>}
      <ul className="dw-list">
        {state.courses.map((c) => (
          <li key={c.id}>
            <button className="dw-card" onClick={() => onPick(c)}>
              {c.imageUrl && <img className="thumb" src={c.imageUrl} alt="" loading="lazy" />}
              <span className="row">
                <strong>{c.name}{c.level && <span className="tag">{c.level}</span>}</strong>
                <span>{formatPrice(c.priceCents, cur)}</span>
              </span>
              <span className="muted">{formatDuration(c.durationMinutes)}</span>
              {c.description && <span className="muted clamp">{c.description}</span>}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}