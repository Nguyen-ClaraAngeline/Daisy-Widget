import { uid } from "../utils/helper";


export function createTracker(studioKey: string) {
  const session = uid();
  let lastStep = "courses";

  const emit = (name: string, props: Record<string, unknown> = {}) => {
    try {
      window.dispatchEvent(new CustomEvent("daisy:event", { detail: { name, studio: studioKey, session, ts: Date.now(), ...props } }));
    } catch {}
  };

  addEventListener("pagehide", () => lastStep !== "confirmed" && emit("abandon", { step: lastStep }));

  return {
    step(step: string) { lastStep = step; emit("step_viewed", { step }); },
    confirmed: () => { lastStep = "confirmed"; emit("booking_confirmed"); },
    conflict: (kind: string) => emit("booking_conflict", { kind }),
    error: (kind: string, step: string) => emit("api_error", { kind, step }),
  };
}
export type Tracker = ReturnType<typeof createTracker>;