import { ReminderStatus, ReminderType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { reminderEmailTemplate } from "@/lib/meeting-email-templates";

function getReminderLabel(reminderType: ReminderType) {
  if (reminderType === ReminderType.reminder_24h) return "in about 24 hours";
  return "in about 1 hour";
}

function getBrandName(userName: string | null | undefined) {
  return userName && userName.trim() ? `${userName} Portfolio` : "Ali Jan Portfolio";
}

export async function runDueReminders(limit = 25) {
  const now = new Date();
  const dueJobs = await prisma.reminderJob.findMany({
    where: {
      status: ReminderStatus.pending,
      reminderAt: { lte: now },
    },
    include: {
      meeting: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { reminderAt: "asc" },
    take: limit,
  });

  const results: Array<{ id: string; bookingId: string; status: string; error?: string }> = [];

  for (const job of dueJobs) {
    const lock = await prisma.reminderJob.updateMany({
      where: { id: job.id, status: ReminderStatus.pending },
      data: { status: ReminderStatus.processing },
    });
    if (lock.count === 0) continue;

    try {
      const meeting = job.meeting;
      if (!meeting?.guestEmail) {
        await prisma.reminderJob.update({
          where: { id: job.id },
          data: {
            status: ReminderStatus.failed,
            attempts: { increment: 1 },
            lastError: "Missing guest email or meeting record.",
          },
        });
        results.push({
          id: job.id,
          bookingId: job.bookingId,
          status: "failed",
          error: "Missing guest email or meeting record.",
        });
        continue;
      }

      const template = reminderEmailTemplate(
        {
          brandName: getBrandName(meeting.user?.name),
          guestName: meeting.guestName || "there",
          meetingStart: meeting.startTime,
          timezone: meeting.timezone,
          meetingUrl: meeting.meetingUrl,
          bookingId: meeting.forgeCalBookingId,
        },
        getReminderLabel(job.reminderType)
      );

      await sendEmail({
        to: meeting.guestEmail,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderStatus.sent,
          sentAt: new Date(),
          attempts: { increment: 1 },
          lastError: null,
        },
      });

      results.push({ id: job.id, bookingId: job.bookingId, status: "sent" });
    } catch (error) {
      const message = (error as Error).message || "Reminder send failed.";
      await prisma.reminderJob.update({
        where: { id: job.id },
        data: {
          status: ReminderStatus.failed,
          attempts: { increment: 1 },
          lastError: message,
        },
      });
      results.push({ id: job.id, bookingId: job.bookingId, status: "failed", error: message });
    }
  }

  return {
    totalDue: dueJobs.length,
    processed: results.length,
    results,
  };
}

