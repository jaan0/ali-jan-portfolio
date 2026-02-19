import { NextResponse } from "next/server";
import { MeetingStatus } from "@prisma/client";
import { forgeCalRequest, getForgeCalServerConfig } from "@/lib/forgecal";
import prisma from "@/lib/prisma";
import { normalizeBookingPayload } from "@/lib/forgecal-booking";
import { getAdminBlockWindows, isTimeBlocked } from "@/lib/meeting-policy";

type CreateBookingBody = {
  slug?: string;
  guestName?: string;
  guestEmail?: string;
  startTime?: string;
  timezone?: string;
  guestMessage?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateBookingBody;
    const config = await getForgeCalServerConfig();
    const slug = body.slug || config.eventSlug;

    if (!body.guestName || !body.guestEmail || !body.startTime || !body.timezone) {
      return NextResponse.json(
        {
          error:
            "Missing required fields. guestName, guestEmail, startTime, and timezone are required.",
        },
        { status: 400 }
      );
    }

    const parsedStart = new Date(body.startTime);
    if (Number.isNaN(parsedStart.getTime())) {
      return NextResponse.json({ error: "Invalid startTime." }, { status: 400 });
    }

    const startDate = parsedStart.toISOString().slice(0, 10);
    const blocks = await getAdminBlockWindows(startDate);
    if (isTimeBlocked(body.startTime, blocks)) {
      return NextResponse.json(
        {
          error: "This time slot is blocked by the admin. Please choose another slot.",
        },
        { status: 400 }
      );
    }

    const payload = {
      slug,
      guestName: body.guestName,
      guestEmail: body.guestEmail,
      startTime: body.startTime,
      timezone: body.timezone,
      guestMessage: body.guestMessage || "",
    };

    const { status, data } = await forgeCalRequest("/api/public/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (status >= 200 && status < 300) {
      const normalized = normalizeBookingPayload(data);
      const adminUser = await prisma.user.findFirst({
        where: { email: "admin@example.com" },
        select: { id: true },
      });

      if (normalized?.bookingId && adminUser?.id) {
        try {
          await prisma.meeting.upsert({
            where: { forgeCalBookingId: normalized.bookingId },
            create: {
              userId: adminUser.id,
              forgeCalBookingId: normalized.bookingId,
              guestName: normalized.guestName || body.guestName,
              guestEmail: normalized.guestEmail || body.guestEmail,
              startTime: normalized.startTime ? new Date(normalized.startTime) : new Date(body.startTime),
              timezone: normalized.timezone || body.timezone,
              guestMessage: normalized.guestMessage || body.guestMessage || "",
              meetingUrl: normalized.meetingUrl || null,
              status: MeetingStatus.requested,
              sourcePayload: data as object,
            },
            update: {
              guestName: normalized.guestName || body.guestName,
              guestEmail: normalized.guestEmail || body.guestEmail,
              startTime: normalized.startTime ? new Date(normalized.startTime) : new Date(body.startTime),
              timezone: normalized.timezone || body.timezone,
              guestMessage: normalized.guestMessage || body.guestMessage || "",
              meetingUrl: normalized.meetingUrl || null,
              status: MeetingStatus.requested,
              sourcePayload: data as object,
            },
          });
        } catch (syncError) {
          console.error("[ForgeCal meeting sync] failed to save booking", syncError);
        }
      }
    }

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create booking." },
      { status: 500 }
    );
  }
}
