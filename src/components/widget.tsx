import { useBookingFlow } from "../hooks/useBookingFlow";
import { themeStyle } from "../utils/theme";
import { CourseList } from "./courseList";
import { SlotList } from "./slotList";
import { ContactForm } from "./contactForm";
import { Confirmation } from "./confirmation";
import { ErrorBanner } from "./statusViews";
import type { WidgetConfig } from "../types";

export function Widget({ config }: { config: WidgetConfig }) {
  const f = useBookingFlow(config);
  const { state } = f;
  return (
    <section className="dw" style={themeStyle(state.studio?.primaryColor, config)} aria-live="polite" aria-label="Réservation">
      {state.studio && <p className="brand">{state.studio.name}</p>}
      {state.error && <ErrorBanner kind={state.error} onRetry={f.retry} />}
      {state.step === "courses" && <CourseList state={state} onPick={f.pickCourse} />}
      {state.step === "slots" && <SlotList state={state} onPick={f.pickSlot} onBack={f.back} />}
      {state.step === "contact" && (
        <ContactForm state={state} onChange={f.setContact} onSeats={f.setSeats} onSubmit={f.submit} onBack={f.back} />
      )}
      {state.step === "confirmed" && <Confirmation state={state} />}
    </section>
  );
}