import crypto from "crypto";
import { NextResponse } from "next/server";
import { getForgeCalServerConfig } from "@/lib/forgecal";
import prisma from "@/lib/prisma";
import { mapWebhookEventToStatus, normalizeBookingPayload } from "@/lib/forgecal-booking";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
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
  const isValid = verifySignature(rawBody, signature, secret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = rawBody;
  }

  console.log("[ForgeCal webhook]", { event, payload });

  const status = mapWebhookEventToStatus(event);
  const normalized = normalizeBookingPayload(payload);

  if (status && normalized?.bookingId) {
    const adminUser = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true },
    });

    if (adminUser?.id) {
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
        console.error("[ForgeCal meeting sync] failed to process webhook", syncError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
