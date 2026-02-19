import { NextResponse } from "next/server";
import { forgeCalRequest, getForgeCalServerConfig } from "@/lib/forgecal";

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

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create booking." },
      { status: 500 }
    );
  }
}
