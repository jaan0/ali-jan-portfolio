import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import {
  parseForgeCalEvent,
  verifyForgeCalSignature,
} from "../src/lib/forgecal-webhook";
import { mapWebhookEventToStatus } from "../src/lib/forgecal-booking";

function sign(rawBody: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

test("valid signature is accepted", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ bookingId: "bk_123" });
  const signature = sign(payload, secret);

  assert.equal(verifyForgeCalSignature(payload, signature, secret), true);
});

test("invalid signature is rejected", () => {
  const secret = "test-secret";
  const payload = JSON.stringify({ bookingId: "bk_123" });
  const invalidSignature = sign(payload, "wrong-secret");

  assert.equal(verifyForgeCalSignature(payload, invalidSignature, secret), false);
});

test("event routing maps supported webhook events", () => {
  const created = parseForgeCalEvent("booking.created");
  const confirmed = parseForgeCalEvent("booking.confirmed");
  const canceled = parseForgeCalEvent("booking.canceled");
  const unsupported = parseForgeCalEvent("booking.unknown");

  assert.equal(created, "booking.created");
  assert.equal(confirmed, "booking.confirmed");
  assert.equal(canceled, "booking.canceled");
  assert.equal(unsupported, null);

  assert.equal(mapWebhookEventToStatus(created!), "requested");
  assert.equal(mapWebhookEventToStatus(confirmed!), "booked");
  assert.equal(mapWebhookEventToStatus(canceled!), "canceled");
});

