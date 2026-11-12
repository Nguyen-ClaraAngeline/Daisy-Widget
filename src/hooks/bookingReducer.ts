import type { ApiErrorKind, Booking, Contact, Course, Notice, Slot, Step, Studio } from "../types";

export type State = {
  step: Step;
  loading: boolean;
  studio?: Studio;
  courses: Course[];
  slots: Slot[];
  course?: Course;
  slot?: Slot;
  seats: number;
  contact: Contact;
  booking?: Booking;
  error?: ApiErrorKind;
  notice?: Notice;
};

export const initialState: State = {
  step: "courses", loading: true, courses: [], slots: [], seats: 1,
  contact: { firstName: "", lastName: "", email: "", phone: "", notes: "" },
};

export type Action =
  | { type: "LOADING" }
  | { type: "INIT"; studio: Studio; courses: Course[] }
  | { type: "PICK_COURSE"; course: Course }
  | { type: "SLOTS"; slots: Slot[] }
  | { type: "PICK_SLOT"; slot: Slot }
  | { type: "CONTACT"; contact: Contact }
  | { type: "SEATS"; seats: number }
  | { type: "BOOKED"; booking: Booking }
  | { type: "CONFLICT"; slots: Slot[]; notice: Notice }
  | { type: "REDUCED"; slots: Slot[]; slot: Slot; notice: Notice }
  | { type: "FAIL"; error: ApiErrorKind }
  | { type: "BACK" };

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "LOADING": return { ...s, loading: true, error: undefined };
    case "INIT": return { ...s, loading: false, studio: a.studio, courses: a.courses, error: undefined };
    case "PICK_COURSE": return { ...s, course: a.course, step: "slots", slots: [], loading: true, notice: undefined, error: undefined };
    case "SLOTS": return { ...s, loading: false, slots: a.slots, error: undefined };
    case "PICK_SLOT": return { ...s, slot: a.slot, seats: Math.min(s.seats, a.slot.seatsAvailable, s.studio?.policy.maxSeats ?? 1) || 1, step: "contact", notice: undefined, error: undefined };
    case "CONTACT": return { ...s, contact: a.contact };
    case "SEATS": return { ...s, seats: a.seats };
    case "BOOKED": return { ...s, step: "confirmed", loading: false, booking: a.booking, error: undefined };
    // Créneau perdu : retour à la liste rafraîchie, coordonnées conservées.
    case "CONFLICT": return { ...s, step: "slots", loading: false, slots: a.slots, slot: undefined, notice: a.notice, error: undefined };
    // Il reste des places, mais moins que demandé : on reste sur le formulaire.
    case "REDUCED": return { ...s, loading: false, slots: a.slots, slot: a.slot, seats: Math.min(s.seats, a.slot.seatsAvailable), notice: a.notice, error: undefined };
    case "FAIL": return { ...s, loading: false, error: a.error };
    case "BACK":
      return s.step === "contact" ? { ...s, step: "slots", slot: undefined, notice: undefined, error: undefined }
        : s.step === "slots" ? { ...s, step: "courses", course: undefined, notice: undefined, error: undefined }
        : s;
  }
}