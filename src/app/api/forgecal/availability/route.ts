import { NextRequest, NextResponse } from "next/server";
import { forgeCalRequest, getForgeCalServerConfig } from "@/lib/forgecal";
import { filterBlockedSlots, getAdminBlockWindows } from "@/lib/meeting-policy";

function getSlots(payload: unknown) {
  return Array.isArray((payload as { slots?: unknown[] })?.slots)
    ? ((payload as { slots: unknown[] }).slots ?? [])
    : Array.isArray((payload as { availableSlots?: unknown[] })?.availableSlots)
      ? ((payload as { availableSlots: unknown[] }).availableSlots ?? [])
      : Array.isArray((payload as { times?: unknown[] })?.times)
        ? ((payload as { times: unknown[] }).times ?? [])
        : [];
}

function nextDate(date: string) {
  const current = new Date(`${date}T00:00:00.000Z`);
  current.setUTCDate(current.getUTCDate() + 1);
  return current.toISOString().slice(0, 10);
}

export async function GET(request: NextRequest) {
  try {
    const config = await getForgeCalServerConfig();
    const slug = request.nextUrl.searchParams.get("slug") || config.eventSlug;
    const date = request.nextUrl.searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing required query parameter: date" },
        { status: 400 }
      );
    }

    let requestedDate = date;
    let movedToDate: string | null = null;

    for (let i = 0; i < 14; i += 1) {
      const query = new URLSearchParams({ slug, date: requestedDate }).toString();
      const { status, data } = await forgeCalRequest(`/api/public/availability?${query}`);
      const blocks = await getAdminBlockWindows(requestedDate);
      const filteredData = filterBlockedSlots(data, blocks);

      if (getSlots(filteredData).length > 0 || status >= 400) {
        const payload =
          movedToDate && filteredData && typeof filteredData === "object"
            ? { ...(filteredData as object), movedToDate }
            : filteredData;
        return NextResponse.json(payload, { status });
      }

      requestedDate = nextDate(requestedDate);
      movedToDate = requestedDate;
    }

    return NextResponse.json(
      { slots: [], movedToDate, error: "No available slots found in the next 14 days." },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch availability." },
      { status: 500 }
    );
  }
}
