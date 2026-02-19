import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function getAdminUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return null;

  const user = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
    select: { id: true },
  });
  return user?.id || null;
}

export async function GET() {
  try {
    const userId = await getAdminUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const blocks = await prisma.meetingBlock.findMany({
      where: { userId },
      orderBy: { startTime: "asc" },
      take: 500,
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    const raw = (error as Error).message || "Failed to load block windows.";
    const message = raw.includes("does not exist")
      ? "MeetingBlock table is missing in database. Run Prisma schema sync/migration on production."
      : raw;
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

type CreateBlockBody = {
  startTime?: string;
  endTime?: string;
  note?: string;
};

export async function POST(request: Request) {
  try {
    const userId = await getAdminUserId();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as CreateBlockBody;
    if (!body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: "startTime and endTime are required." },
        { status: 400 }
      );
    }

    const start = new Date(body.startTime);
    const end = new Date(body.endTime);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return NextResponse.json({ error: "Invalid start/end time." }, { status: 400 });
    }

    const block = await prisma.meetingBlock.create({
      data: {
        userId,
        startTime: start,
        endTime: end,
        note: body.note || null,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    const raw = (error as Error).message || "Failed to create block window.";
    const message = raw.includes("does not exist")
      ? "MeetingBlock table is missing in database. Run Prisma schema sync/migration on production."
      : raw;
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
