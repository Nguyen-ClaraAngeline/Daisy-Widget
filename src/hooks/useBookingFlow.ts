import { useCallback, useEffect, useMemo, useReducer } from "react";
import { ApiError, createApi } from "../services/api";
import { createTracker } from "../services/tracker";
import type { Course, Slot, WidgetConfig } from "../types";
import { initialState, reducer } from "./bookingReducer";

export function useBookingFlow(cfg: WidgetConfig) {
  const api = useMemo(() => createApi(cfg.apiBase, cfg.studioKey), [cfg.apiBase, cfg.studioKey]);
  const tracker = useMemo(() => createTracker(cfg.studioKey), [cfg.studioKey]);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => { tracker.step(state.step); }, [state.step, tracker]);

  const fail = useCallback((e: unknown, step: string) => {
    const kind = e instanceof ApiError ? e.kind : "network";
    if (kind === "origin") console.error("[daisy] Domaine non déclaré dans le back-office Daisy :", location.origin);
    tracker.error(kind, step);
    dispatch({ type: "FAIL", error: kind });
  }, [tracker]);

  const init = useCallback(() => {
    dispatch({ type: "LOADING" });
    Promise.all([api.getStudio(), api.getCourses()])
      .then(([studio, courses]) => dispatch({ type: "INIT", studio, courses }))
      .catch((e) => fail(e, "courses"));
  }, [api, fail]);
  useEffect(init, [init]);

  const loadSlots = useCallback((courseId: string) => {
    dispatch({ type: "LOADING" });
    api.getSlots(courseId).then((slots) => dispatch({ type: "SLOTS", slots })).catch((e) => fail(e, "slots"));
  }, [api, fail]);

  const pickCourse = (course: Course) => { dispatch({ type: "PICK_COURSE", course }); loadSlots(course.id); };
  const pickSlot = (slot: Slot) => dispatch({ type: "PICK_SLOT", slot });

  const submit = async () => {
    if (!state.slot || !state.course || state.loading) return; // anti double-clic
    dispatch({ type: "LOADING" });
    try {
      const booking = await api.createBooking(state.slot.id, state.seats, state.contact);
      tracker.confirmed();
      dispatch({ type: "BOOKED", booking });
    } catch (e) {
      if (e instanceof ApiError && (e.kind === "full" || e.kind === "cancelled")) {
        tracker.conflict(e.kind);
        try {
          const slots = await api.getSlots(state.course.id);
          const fresh = slots.find((s) => s.id === state.slot!.id);
          if (e.kind === "full" && fresh && fresh.seatsAvailable > 0) {
            dispatch({ type: "REDUCED", slots, slot: fresh, notice: { kind: "reduced", available: fresh.seatsAvailable } });
          } else {
            dispatch({ type: "CONFLICT", slots, notice: { kind: e.kind === "full" ? "taken" : "cancelled" } });
          }
        } catch (e2) { fail(e2, "contact"); }
      } else {
        fail(e, "contact");
      }
    }
  };

  const retry = () => {
    if (state.step === "courses") init();
    else if (state.step === "slots" && state.course) loadSlots(state.course.id);
    else if (state.step === "contact") submit();
  };

  return {
    state, pickCourse, pickSlot, submit, retry,
    setContact: (contact: typeof state.contact) => dispatch({ type: "CONTACT", contact }),
    setSeats: (seats: number) => dispatch({ type: "SEATS", seats }),
    back: () => dispatch({ type: "BACK" }),
  };
}