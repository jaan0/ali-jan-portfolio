import prisma from "@/lib/prisma";

export type BlockWindow = {
  startTime: Date;
  endTime: Date;
};

function readSlotIso(slot: unknown): string | null {
  if (typeof slot === "string") return slot;
  if (!slot || typeof slot !== "object") return null;
  const record = slot as Record<string, unknown>;
  const iso =
    (typeof record.startTime === "string" && record.startTime) ||
    (typeof record.time === "string" && record.time) ||
    (typeof record.start === "string" && record.start) ||
    (typeof record.value === "string" && record.value) ||
    null;
  return iso;
}

export function isTimeBlocked(startIso: string, blocks: BlockWindow[]) {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return false;
  const ms = start.getTime();
  return blocks.some((block) => ms >= block.startTime.getTime() && ms < block.endTime.getTime());
}

export function filterBlockedSlots(payload: unknown, blocks: BlockWindow[]): unknown {
  if (!payload || typeof payload !== "object" || blocks.length === 0) return payload;

  const record = payload as Record<string, unknown>;
  const keys = ["slots", "availableSlots", "times"] as const;

  for (const key of keys) {
    const value = record[key];
    if (!Array.isArray(value)) continue;
    record[key] = value.filter((slot) => {
      const iso = readSlotIso(slot);
      if (!iso) return true;
      return !isTimeBlocked(iso, blocks);
    });
    return record;
  }

  return payload;
}

export async function getAdminBlockWindows(date: string): Promise<BlockWindow[]> {
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const user = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
    select: { id: true },
  });
  if (!user) return [];

  const blocks = await prisma.meetingBlock.findMany({
    where: {
      userId: user.id,
      startTime: { lte: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { startTime: true, endTime: true },
  });

  return blocks;
}

