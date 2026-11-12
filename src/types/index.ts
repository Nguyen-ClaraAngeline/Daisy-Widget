export type Studio = {
  id: string;
  name: string;
  timezone: string;
  currency: string;
  primaryColor?: string;
  policy: { requiresPhone: boolean; cancellationHours: number; maxSeats: number };
};

export type Course = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  imageUrl?: string;
  level?: string;
};

export type Slot = {
  id: string;
  startsAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  priceCents: number;

export type Booking = { id: string; status: string; code: string; totalCents: number };

export type Contact = { firstName: string; lastName: string; email: string; phone: string; notes: string };
export type ContactErrors = Partial<Record<keyof Contact, string>>;

export type ApiErrorKind =
  | "network" | "timeout" | "server"
  | "origin" | "rate_limited"
  | "full" | "cancelled" | "phone_required" | "too_many_seats" | "validation"
  | "uncertain";

export type Step = "courses" | "slots" | "contact" | "confirmed";

export type Notice = { kind: "taken" | "reduced" | "cancelled"; available?: number };

export type WidgetConfig = {
  apiBase: string;
  studioKey: string;
  radius?: string;
  font?: string;
};