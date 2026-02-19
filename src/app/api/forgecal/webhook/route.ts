import { NextResponse } from "next/server";
import { getForgeCalServerConfig } from "@/lib/forgecal";
import prisma from "@/lib/prisma";
import { mapWebhookEventToStatus, normalizeBookingPayload } from "@/lib/forgecal-booking";
import {
  getWebhookDeliveryHash,
  parseForgeCalEvent,
  parseWebhookPayload,
  verifyForgeCalSignature,
} from "@/lib/forgecal-webhook";
import { runForgeCalWorkflows } from "@/lib/forgecal-workflows";

export const runtime = "nodejs";

function logWebhook(input: Record<string, unknown>) {
  console.log(JSON.stringify({ source: "forgecal-webhook", ...input }));
}

export async function POST(request: Request) {
  const config = await getForgeCalServerConfig();
  const secret = config.webhookSecret;

  if (!secret) {
    return NextResponse.json(
      { error: "ForgeCal webhook secret is not configured in admin profile or env." },
      { status: 500 }
    );
  }

  const event = request.headers.get("x-forgecal-event");
  const signature = request.headers.get("x-forgecal-signature");

  if (!event || !signature) {
    return NextResponse.json({ error: "Missing webhook headers." }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = verifyForgeCalSignature(rawBody, signature, secret);

  if (!isValid) {
    logWebhook({ event, result: "invalid_signature" });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const parsedEvent = parseForgeCalEvent(event);
  if (!parsedEvent) {
    logWebhook({ event, result: "unsupported_event" });
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const payload = parseWebhookPayload(rawBody);
  const normalized = normalizeBookingPayload(payload);
  const bookingId = normalized?.bookingId || "unknown";
  const deliveryHash = getWebhookDeliveryHash(rawBody);

  logWebhook({ event: parsedEvent, bookingId, result: "received" });

  if (!normalized?.bookingId) {
    logWebhook({ event: parsedEvent, bookingId, result: "missing_booking_id" });
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  const adminUser = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
    select: { id: true },
  });

  if (!adminUser?.id) {
    logWebhook({ event: parsedEvent, bookingId, result: "admin_user_missing" });
    return NextResponse.json({ ok: true, ignored: true }, { status: 200 });
  }

  try {
    await prisma.webhookDelivery.create({
      data: {
        userId: adminUser.id,
        eventName: parsedEvent,
        bookingId: normalized.bookingId,
        deliveryHash,
        payload: payload as object,
      },
    });
  } catch (error) {
    const maybePrisma = error as { code?: string };
    if (maybePrisma.code === "P2002") {
      logWebhook({ event: parsedEvent, bookingId, result: "duplicate_delivery_ignored" });
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }
    throw error;
  }

  const status = mapWebhookEventToStatus(parsedEvent);
  if (status) {
    try {
      await prisma.meeting.upsert({
        where: { forgeCalBookingId: normalized.bookingId },
        create: {
          userId: adminUser.id,
          forgeCalBookingId: normalized.bookingId,
          guestName: normalized.guestName || null,
          guestEmail: normalized.guestEmail || null,
          startTime: normalized.startTime ? new Date(normalized.startTime) : null,
          timezone: normalized.timezone || null,
          guestMessage: normalized.guestMessage || null,
          meetingUrl: normalized.meetingUrl || null,
          status,
          sourcePayload: payload as object,
        },
        update: {
          guestName: normalized.guestName || undefined,
          guestEmail: normalized.guestEmail || undefined,
          startTime: normalized.startTime ? new Date(normalized.startTime) : undefined,
          timezone: normalized.timezone || undefined,
          guestMessage: normalized.guestMessage || undefined,
          meetingUrl: normalized.meetingUrl || undefined,
          status,
          sourcePayload: payload as object,
        },
      });
    } catch (syncError) {
      logWebhook({
        event: parsedEvent,
        bookingId,
        result: "meeting_sync_failed",
        error: (syncError as Error).message,
      });
    }
  }

  try {
    await runForgeCalWorkflows({
      eventName: parsedEvent,
      bookingId: normalized.bookingId,
      payload,
    });
    logWebhook({ event: parsedEvent, bookingId, result: "workflow_completed" });
  } catch (workflowError) {
    logWebhook({
      event: parsedEvent,
      bookingId,
      result: "workflow_failed",
      error: (workflowError as Error).message,
    });
  }

  logWebhook({ event: parsedEvent, bookingId, result: "accepted" });
  return NextResponse.json({ ok: true });
}
