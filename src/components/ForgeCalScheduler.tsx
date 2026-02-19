"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type SlotOption = {
  value: string;
  label: string;
};

type BookingResult = {
  bookingId: string;
  meetingUrl?: string;
};

function toSlotOptions(input: unknown, timezone: string): SlotOption[] {
  const source = Array.isArray(input)
    ? input
    : Array.isArray((input as { slots?: unknown[] })?.slots)
      ? ((input as { slots: unknown[] }).slots as unknown[])
      : Array.isArray((input as { availableSlots?: unknown[] })?.availableSlots)
        ? ((input as { availableSlots: unknown[] }).availableSlots as unknown[])
        : Array.isArray((input as { times?: unknown[] })?.times)
          ? ((input as { times: unknown[] }).times as unknown[])
          : [];

  return source
    .map((slot): string | null => {
      if (typeof slot === "string") return slot;
      if (slot && typeof slot === "object") {
        const record = slot as Record<string, unknown>;
        const value = record.startTime || record.time || record.start || record.value;
        return typeof value === "string" ? value : null;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value))
    .map((iso) => {
      const date = new Date(iso);
      return {
        value: iso,
        label: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: timezone,
        }),
      };
    });
}

function readErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "error" in data) {
    const error = (data as { error?: unknown }).error;
    if (typeof error === "string") return error;
  }
  return fallback;
}

function normalizeBookingResponse(data: unknown): BookingResult | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const nested =
    record.booking && typeof record.booking === "object"
      ? (record.booking as Record<string, unknown>)
      : null;

  const bookingId =
    (typeof record.bookingId === "string" && record.bookingId) ||
    (typeof record.id === "string" && record.id) ||
    (nested && typeof nested.id === "string" ? nested.id : null);

  if (!bookingId) return null;

  const meetingUrl =
    (typeof record.meetingUrl === "string" && record.meetingUrl) ||
    (typeof record.url === "string" && record.url) ||
    (nested && typeof nested.meetingUrl === "string" ? nested.meetingUrl : undefined);

  return { bookingId, meetingUrl };
}

export default function ForgeCalScheduler({ slug }: { slug: string }) {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [slots, setSlots] = useState<SlotOption[]>([]);
  const [widgetTitle, setWidgetTitle] = useState("Book a Call");
  const [status, setStatus] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  useEffect(() => {
    const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (localZone) setTimezone(localZone);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      try {
        const response = await fetch(`/api/forgecal/widget-config?slug=${encodeURIComponent(slug)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(readErrorMessage(data, "Failed to load scheduler config."));
        }
        const title =
          (typeof data?.title === "string" && data.title) ||
          (typeof data?.name === "string" && data.name) ||
          "Book a Call";
        if (!cancelled) setWidgetTitle(title);
      } catch (error) {
        if (!cancelled) setStatus((error as Error).message);
      }
    }

    loadConfig();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!date) {
      setSlots([]);
      setSlot("");
      return;
    }

    let cancelled = false;
    async function loadAvailability() {
      setLoadingSlots(true);
      setStatus("");
      try {
        const query = new URLSearchParams({ slug, date }).toString();
        const response = await fetch(`/api/forgecal/availability?${query}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(readErrorMessage(data, "Failed to load available time slots."));
        }

        const normalizedSlots = toSlotOptions(data, timezone);
        if (!cancelled) {
          setSlots(normalizedSlots);
          setSlot(normalizedSlots[0]?.value || "");
        }
      } catch (error) {
        if (!cancelled) {
          setSlots([]);
          setSlot("");
          setStatus((error as Error).message);
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }

    loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [date, slug, timezone]);

  const minDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!slot) {
      setStatus("Please select an available time slot.");
      return;
    }

    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch("/api/forgecal/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          guestName: name,
          guestEmail: email,
          startTime: slot,
          timezone,
          guestMessage: message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Booking failed."));
      }

      const normalized = normalizeBookingResponse(data);
      if (!normalized) {
        throw new Error("Booking succeeded but response was missing booking details.");
      }

      setBooking(normalized);
      setStatus("Booking created successfully.");
      localStorage.setItem("forgecal:last-booking", JSON.stringify(normalized));
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking() {
    if (!booking?.bookingId) return;

    setSubmitting(true);
    setStatus("");
    try {
      const response = await fetch(`/api/forgecal/bookings/${booking.bookingId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(readErrorMessage(data, "Failed to cancel booking."));
      }
      setStatus("Booking canceled.");
      setBooking(null);
      localStorage.removeItem("forgecal:last-booking");
    } catch (error) {
      setStatus((error as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">{widgetTitle}</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Your Name</label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Email (Gmail)</label>
              <input
                type="email"
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Date</label>
              <input
                type="date"
                min={minDate}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Timezone</label>
              <input
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Available Times</label>
            <select
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm"
              value={slot}
              onChange={(event) => setSlot(event.target.value)}
              required
              disabled={loadingSlots || slots.length === 0}
            >
              {slots.length === 0 && <option value="">{loadingSlots ? "Loading..." : "No slots found"}</option>}
              {slots.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">Message (Optional)</label>
            <textarea
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm min-h-24"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-full disabled:opacity-50"
          >
            {submitting ? "Processing..." : "Book Meeting"}
          </button>
        </form>

        {booking && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="text-emerald-700">Booking ID: {booking.bookingId}</p>
            {booking.meetingUrl && (
              <a
                href={booking.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline break-all"
              >
                {booking.meetingUrl}
              </a>
            )}
            <div className="mt-3">
              <button
                type="button"
                onClick={cancelBooking}
                className="text-red-600 underline"
                disabled={submitting}
              >
                Cancel this booking
              </button>
            </div>
          </div>
        )}

        {status && <p className="text-sm text-slate-600">{status}</p>}
      </div>
    </section>
  );
}

