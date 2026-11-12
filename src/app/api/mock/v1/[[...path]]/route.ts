import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const json = (b: unknown, status = 200) => NextResponse.json(b, { status });

const seats: Record<string, number> = {};
const slotsFor = (courseId: string) =>
  [0, 1, 2, 3].map((i) => {
    const id = `slt_${courseId}_${i}`;
    seats[id] ??= i === 1 ? 0 : i === 2 ? 1 : 8; // créneau complet, "dernière place", normal
    const d = new Date(Date.now() + (7 * (i + 1)) * 864e5);
    d.setUTCHours(13, 0, 0, 0);
    return { slot_id: id, starts_at: d.toISOString(), seats_total: 8, seats_available: seats[id], price_cents: i === 3 ? 8500 : 7500 };
  });

export async function GET(_: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const p = (await params).path ?? [];
  await sleep(300);
  if (p[0] === "studio")
    return json({
      studio_id: "std_2201", name: "Atelier Terre & Feu", timezone: "Europe/Paris", currency: "EUR",
      branding: { primary_color: "#C4643A", logo_url: null },
      booking_policy: { requires_phone: true, cancellation_hours: 48, max_seats_per_booking: 4 },
    });
  if (p[0] === "courses" && p.length === 1)
    return json({
      courses: [
        { course_id: "crs_118", name: "Tour de potier — débutant", description: "Deux heures d'initiation au tournage. Tout le matériel est fourni.", duration_minutes: 120, price_cents: 7500, image_url: null, level: "debutant" },
        { course_id: "crs_119", name: "Émaillage", description: "", duration_minutes: 90, price_cents: 6000, image_url: null, level: null },
      ],
    });
    if (p[0] === "courses" && p[2] === "slots" && p[1]) return json({ slots: slotsFor(p[1]) });
    return json({ error: "not_found" }, 404);
}

export async function POST(req: NextRequest) {
  await sleep(1500 + Math.random() * 2500); // latence réelle : 1,5 à 4 s
  const b = await req.json();
  const email: string = b.customer?.email ?? "";
  if (email.includes("500")) return json({ error: "server_error" }, 500);                  // test erreur serveur
  if (!b.customer?.phone) return json({ error: "phone_required" }, 422);
  if (b.seats > 4) return json({ error: "too_many_seats" }, 422);
  if (email.includes("race")) seats[b.slot_id] = 0;                                        // simule "dernière place partie"
  const left = seats[b.slot_id] ?? 0;
  if (left < b.seats) return json({ error: "slot_full", available: left }, 409);
  seats[b.slot_id] = left - b.seats;
  return json({ booking_id: "bkg_" + Date.now(), status: "confirmed", confirmation_code: "TF-3K9Q", total_cents: 7500 * b.seats }, 201);
}