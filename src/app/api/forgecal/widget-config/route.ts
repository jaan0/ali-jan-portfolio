import { NextRequest, NextResponse } from "next/server";
import { forgeCalRequest, getForgeCalServerConfig } from "@/lib/forgecal";

export async function GET(request: NextRequest) {
  try {
    const config = await getForgeCalServerConfig();
    const slug = request.nextUrl.searchParams.get("slug") || config.eventSlug;

    const { status, data } = await forgeCalRequest(
      `/api/public/widget-config?slug=${encodeURIComponent(slug)}`
    );

    return NextResponse.json(data, { status });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || "Failed to fetch widget config." },
      { status: 500 }
    );
  }
}
