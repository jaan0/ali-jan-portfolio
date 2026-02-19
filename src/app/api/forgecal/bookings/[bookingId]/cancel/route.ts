import { NextResponse } from "next/server";
import { forgeCalRequest } from "@/lib/forgecal";

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

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to cancel booking." },
      { status: 500 }
    );
  }
}

