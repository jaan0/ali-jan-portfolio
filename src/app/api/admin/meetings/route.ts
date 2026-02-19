import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
    }

    const meetings = await prisma.meeting.findMany({
      where: { userId: user.id },
      orderBy: { startTime: "desc" },
      take: 200,
    });

    return NextResponse.json({ meetings });
  } catch (error) {
    const message = (error as Error).message || "Failed to load meetings.";
    return NextResponse.json({ meetings: [], error: message }, { status: 200 });
  }
}
