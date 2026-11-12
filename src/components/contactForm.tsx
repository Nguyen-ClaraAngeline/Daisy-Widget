import { useState } from "react";
import type { State } from "../hooks/bookingReducer";
import type { Contact, ContactErrors } from "../types";
import { formatDay, formatPrice, formatTime } from "../utils/formats";
import { MSG } from "../utils/messages";
import { validateContact } from "../utils/validate";

type Props = {
  state: State;
  onChange: (c: Contact) => void;
  onSeats: (n: number) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ContactForm({ state, onChange, onSeats, onSubmit, onBack }: Props) {
  const [errors, setErrors] = useState<ContactErrors>({});
  const { contact, slot, loading, studio, seats } = state;
  if (!slot || !studio) return null;

  const requiresPhone = studio.policy.requiresPhone;
  const maxSeats = Math.max(1, Math.min(studio.policy.maxSeats, slot.seatsAvailable));
  const tz = studio.timezone;

  const handle = () => {
    if (loading) return;
    const e = validateContact(contact, requiresPhone);
    setErrors(e);
    if (Object.keys(e).length === 0) onSubmit();
  };

  const field = (k: Exclude<keyof Contact, "notes">, type: string, auto: string, label: string) => (
    <div className="dw-field">
      <label htmlFor={`dw-${k}`}>{label}</label>
      <input
        id={`dw-${k}`} className="dw-input" type={type} autoComplete={auto} value={contact[k]}
        aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `dw-${k}-e` : undefined}
        onChange={(e) => onChange({ ...contact, [k]: e.target.value })}
      />
      {errors[k] && <span id={`dw-${k}-e`} className="dw-err">{errors[k]}</span>}
    </div>
  );

  return (
    <>
      <h2>Vos coordonnées</h2>
      <p className="muted">{state.course?.name}, {formatDay(slot.startsAt, tz)} à {formatTime(slot.startsAt, tz)}</p>
      {state.notice?.kind === "reduced" && <div className="dw-banner warn" role="alert">{MSG.reduced(state.notice.available ?? 0)}</div>}
      {/* div et non <form> : pas de soumission native ni de rechargement sur le site hôte */}
      <div role="group" aria-label="Coordonnées">
        <div className="dw-pair">
          {field("firstName", "text", "given-name", MSG.fields.firstName)}
          {field("lastName", "text", "family-name", MSG.fields.lastName)}
        </div>
        {field("email", "email", "email", MSG.fields.email)}
        {field("phone", "tel", "tel", requiresPhone ? MSG.fields.phone : MSG.fields.phoneOpt)}
        {maxSeats > 1 && (
          <div className="dw-field">
            <label htmlFor="dw-seats">{MSG.seats}</label>
            <select id="dw-seats" className="dw-input" value={seats} onChange={(e) => onSeats(Number(e.target.value))}>
              {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        <div className="dw-field">
          <label htmlFor="dw-notes">{MSG.notes}</label>
          <textarea id="dw-notes" className="dw-input area" value={contact.notes} onChange={(e) => onChange({ ...contact, notes: e.target.value })} />
        </div>
        <p className="dw-total">{MSG.total(formatPrice(slot.priceCents * seats, studio.currency))}</p>
      </div>
      <div className="dw-actions">
        <button className="dw-btn" aria-disabled={loading} onClick={handle}>{loading ? MSG.confirming : MSG.confirm}</button>
        <button className="dw-btn ghost" onClick={onBack}>{MSG.back}</button>
      </div>
    </>
  );
}