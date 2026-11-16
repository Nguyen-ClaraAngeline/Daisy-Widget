import { useState } from "react";
import type { State } from "../hooks/bookingReducer";
import type { Course } from "../types";
import { formatDuration, formatPrice } from "../utils/formats";
import { MSG } from "../utils/messages";
import { Loading } from "./statusViews";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function CourseList({ state, onPick }: { state: State; onPick: (c: Course) => void }) {
  const [q, setQ] = useState("");
  if (state.loading) return <Loading />;
  const cur = state.studio?.currency;
  const list = state.courses.filter((c) => norm(c.name).includes(norm(q)));
  return (
    <>
      <h2>Choisissez un cours</h2>
      {state.courses.length > 8 && (
        <div className="dw-field">
          <label htmlFor="dw-search">{MSG.search}</label>
          <input id="dw-search" className="dw-input" type="search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}
      {!state.error && state.courses.length === 0 && <p className="muted">{MSG.noCourses}</p>}
      {state.courses.length > 0 && list.length === 0 && <p className="muted">{MSG.noMatch}</p>}
      <ul className="dw-list">
        {list.map((c) => (
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