import crypto from "crypto";

export type ForgeCalWebhookEvent =
  | "booking.created"
  | "booking.confirmed"
  | "booking.canceled";

const SUPPORTED_EVENTS: ForgeCalWebhookEvent[] = [
  "booking.created",
  "booking.confirmed",
  "booking.canceled",
];

export function verifyForgeCalSignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
}

export function parseForgeCalEvent(eventHeader: string | null): ForgeCalWebhookEvent | null {
  if (!eventHeader) return null;
  return SUPPORTED_EVENTS.includes(eventHeader as ForgeCalWebhookEvent)
    ? (eventHeader as ForgeCalWebhookEvent)
    : null;
}

export function parseWebhookPayload(rawBody: string): unknown {
  try {
    return JSON.parse(rawBody);
  } catch {
    return rawBody;
  }
}

export function getWebhookDeliveryHash(rawBody: string) {
  return crypto.createHash("sha256").update(rawBody).digest("hex");
}

