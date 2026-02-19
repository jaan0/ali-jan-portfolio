import { NextResponse } from "next/server";
import { MeetingStatus } from "@prisma/client";
import { forgeCalRequest } from "@/lib/forgecal";
import prisma from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await context.params;

    if (!bookingId) {
      return NextResponse.json({ error: "Missing bookingId." }, { status: 400 });
    }

    const { status, data } = await forgeCalRequest(
      `/api/public/bookings/${encodeURIComponent(bookingId)}/cancel`,
      { method: "POST" }
    );

    if (status >= 200 && status < 300) {
      try {
        await prisma.meeting.updateMany({
          where: { forgeCalBookingId: bookingId },
          data: { status: MeetingStatus.canceled },
        });
      } catch (syncError) {
        console.error("[ForgeCal meeting sync] failed to update cancellation", syncError);
      }
    }

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to cancel booking." },
      { status: 500 }
    );
  }
}
