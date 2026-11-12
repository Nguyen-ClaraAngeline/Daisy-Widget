import type { ApiErrorKind, Booking, Contact, Course, Slot, Studio } from "../types";

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, public status?: number, public available?: number) {
    super(kind);
  }
}

const TIMEOUT = { read: 8000, write: 15000 };
const WINDOW_DAYS = 89;

const ERR: Record<string, ApiErrorKind> = {
  slot_full: "full", slot_cancelled: "cancelled", phone_required: "phone_required",
  too_many_seats: "too_many_seats", rate_limited: "rate_limited", origin_not_allowed: "origin",
};

const day = (d: Date) => d.toISOString().slice(0, 10);

const mapStudio = (s: any): Studio => ({
  id: s.studio_id, name: s.name, timezone: s.timezone || "Europe/Paris", currency: s.currency || "EUR",
  primaryColor: s.branding?.primary_color,
  policy: {
    requiresPhone: !!s.booking_policy?.requires_phone,
    cancellationHours: s.booking_policy?.cancellation_hours ?? 0,
    maxSeats: s.booking_policy?.max_seats_per_booking ?? 1,
  },
});
const mapCourse = (c: any): Course => ({
  id: c.course_id, name: c.name, description: c.description ?? "", durationMinutes: c.duration_minutes,
  priceCents: c.price_cents, imageUrl: c.image_url || undefined, level: c.level || undefined,
});
const mapSlot = (s: any): Slot => ({
  id: s.slot_id, startsAt: s.starts_at, seatsTotal: s.seats_total,
  seatsAvailable: s.seats_available, priceCents: s.price_cents,
});

export function createApi(base: string, studioKey: string) {
  async function request<T>(path: string, init: RequestInit = {}, write = false): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), write ? TIMEOUT.write : TIMEOUT.read);
    try {
      const res = await fetch(base + path, {
        ...init,
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json", "X-Studio-Key": studioKey },
      });
      if (res.ok) return (await res.json()) as T;
      const body = await res.json().catch(() => ({}));
      const kind: ApiErrorKind =
        ERR[body.error] ??
        (res.status === 403 ? "origin" : res.status === 429 ? "rate_limited" : res.status >= 500 ? "server" : "validation");
      throw new ApiError(kind, res.status, body.available);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (write) throw new ApiError("uncertain");
      throw new ApiError((e as Error).name === "AbortError" ? "timeout" : "network");
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    getStudio: async () => mapStudio(await request("/studio")),
    getCourses: async () => ((await request<{ courses: unknown[] }>("/courses")).courses).map(mapCourse),
    getSlots: async (courseId: string) => {
      const from = new Date(), to = new Date(Date.now() + WINDOW_DAYS * 864e5);
      const q = `?from=${day(from)}&to=${day(to)}`;
      const r = await request<{ slots: unknown[] }>(`/courses/${encodeURIComponent(courseId)}/slots${q}`);
      return r.slots.map(mapSlot);
    },
    createBooking: async (slotId: string, seats: number, c: Contact): Promise<Booking> => {
      const r = await request<{ booking_id: string; status: string; confirmation_code: string; total_cents: number }>(
        "/bookings",
        {
          method: "POST",
          body: JSON.stringify({
            slot_id: slotId, seats,
            customer: { first_name: c.firstName.trim(), last_name: c.lastName.trim(), email: c.email.trim(), phone: c.phone.trim() || undefined },
            notes: c.notes.trim() || undefined,
          }),
        },
        true,
      );
      return { id: r.booking_id, status: r.status, code: r.confirmation_code, totalCents: r.total_cents };
    },
  };
}
export type Api = ReturnType<typeof createApi>;