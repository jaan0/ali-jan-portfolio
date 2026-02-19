import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ blockId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("admin_session");
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findFirst({
      where: { email: "admin@example.com" },
      select: { id: true },
    });
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { blockId } = await context.params;
    if (!blockId) return NextResponse.json({ error: "Missing blockId." }, { status: 400 });

    await prisma.meetingBlock.deleteMany({
      where: { id: blockId, userId: user.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const raw = (error as Error).message || "Failed to delete block window.";
    const message = raw.includes("does not exist")
      ? "MeetingBlock table is missing in database. Run Prisma schema sync/migration on production."
      : raw;
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
