import { NextRequest, NextResponse } from "next/server";
import { forgeCalRequest, getForgeCalServerConfig } from "@/lib/forgecal";

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

    const query = new URLSearchParams({ slug, date }).toString();
    const { status, data } = await forgeCalRequest(`/api/public/availability?${query}`);

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch availability." },
      { status: 500 }
    );
  }
}
