const LOCALE = "fr-FR";

export const formatPrice = (cents: number, currency = "EUR") =>
  new Intl.NumberFormat(LOCALE, { style: "currency", currency }).format(cents / 100);

// Always the atelier's timezone, never the visitor's browser: "14h" must mean 14h at the atelier.
export const formatDay = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat(LOCALE, { weekday: "long", day: "numeric", month: "long", timeZone }).format(new Date(iso));

export const formatTime = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit", timeZone }).format(new Date(iso));

export const formatDuration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} h` : `${h} h ${m}`;
};