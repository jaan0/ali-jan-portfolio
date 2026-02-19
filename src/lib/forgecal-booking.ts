import { MeetingStatus } from "@prisma/client";

export type NormalizedBooking = {
  bookingId: string;
  guestName?: string;
  guestEmail?: string;
  startTime?: string;
  timezone?: string;
  guestMessage?: string;
  meetingUrl?: string;
};

function asRecord(input: unknown): Record<string, unknown> | null {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : null;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

export function normalizeBookingPayload(input: unknown): NormalizedBooking | null {
  const root = asRecord(input);
  if (!root) return null;

  const nested = asRecord(root.booking);
  const source = nested || root;

  const bookingId =
    pickString(source, ["id", "bookingId"]) || pickString(root, ["id", "bookingId"]);
  if (!bookingId) return null;

  return {
    bookingId,
    guestName: pickString(source, ["guestName", "name"]) || pickString(root, ["guestName", "name"]),
    guestEmail:
      pickString(source, ["guestEmail", "email"]) || pickString(root, ["guestEmail", "email"]),
    startTime:
      pickString(source, ["startTime", "start"]) || pickString(root, ["startTime", "start"]),
    timezone: pickString(source, ["timezone"]) || pickString(root, ["timezone"]),
    guestMessage:
      pickString(source, ["guestMessage", "message"]) ||
      pickString(root, ["guestMessage", "message"]),
    meetingUrl: pickString(source, ["meetingUrl", "url"]) || pickString(root, ["meetingUrl", "url"]),
  };
}

export function mapWebhookEventToStatus(event: string): MeetingStatus | null {
  if (event === "booking.created") return MeetingStatus.requested;
  if (event === "booking.confirmed") return MeetingStatus.booked;
  if (event === "booking.canceled") return MeetingStatus.canceled;
  return null;
}

