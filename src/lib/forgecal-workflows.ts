import { ReminderStatus, ReminderType } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import {
  cancellationEmailTemplate,
  confirmationEmailTemplate,
} from "@/lib/meeting-email-templates";

type WorkflowContext = {
  eventName: string;
  bookingId: string;
  payload: unknown;
};

function addHours(date: Date, hours: number) {
  const value = new Date(date);
  value.setTime(value.getTime() + hours * 60 * 60 * 1000);
  return value;
}

function getBrandName(userName: string | null | undefined) {
  return userName && userName.trim() ? `${userName} Portfolio` : "Ali Jan Portfolio";
}

async function sendConfirmationEmail(context: WorkflowContext) {
  const meeting = await prisma.meeting.findUnique({
    where: { forgeCalBookingId: context.bookingId },
    include: { user: { select: { name: true } } },
  });
  if (!meeting?.guestEmail) return;

  const brandName = getBrandName(meeting.user?.name);
  const guestName = meeting.guestName || "there";
  const email = confirmationEmailTemplate({
    brandName,
    guestName,
    meetingStart: meeting.startTime,
    timezone: meeting.timezone,
    meetingUrl: meeting.meetingUrl,
    bookingId: context.bookingId,
  });

  await sendEmail({
    to: meeting.guestEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

async function sendCancellationEmail(context: WorkflowContext) {
  const meeting = await prisma.meeting.findUnique({
    where: { forgeCalBookingId: context.bookingId },
    include: { user: { select: { name: true } } },
  });
  if (!meeting?.guestEmail) return;

  const brandName = getBrandName(meeting.user?.name);
  const guestName = meeting.guestName || "there";
  const email = cancellationEmailTemplate({
    brandName,
    guestName,
    meetingStart: meeting.startTime,
    timezone: meeting.timezone,
    meetingUrl: meeting.meetingUrl,
    bookingId: context.bookingId,
  });

  await sendEmail({
    to: meeting.guestEmail,
    subject: email.subject,
    html: email.html,
    text: email.text,
  });
}

async function scheduleReminders(context: WorkflowContext) {
  const meeting = await prisma.meeting.findUnique({
    where: { forgeCalBookingId: context.bookingId },
    select: { id: true, userId: true, startTime: true },
  });
  if (!meeting?.startTime) return;

  const now = new Date();
  const reminder24h = addHours(meeting.startTime, -24);
  const reminder1h = addHours(meeting.startTime, -1);

  const jobs: Array<{ type: ReminderType; runAt: Date }> = [];
  if (reminder24h > now) jobs.push({ type: ReminderType.reminder_24h, runAt: reminder24h });
  if (reminder1h > now) {
    jobs.push({ type: ReminderType.reminder_1h, runAt: reminder1h });
  } else if (meeting.startTime > now) {
    // If confirmed less than 1 hour before start, send a near-immediate reminder.
    jobs.push({ type: ReminderType.reminder_1h, runAt: new Date(now.getTime() + 60 * 1000) });
  }

  for (const job of jobs) {
    await prisma.reminderJob.upsert({
      where: {
        bookingId_reminderType: {
          bookingId: context.bookingId,
          reminderType: job.type,
        },
      },
      create: {
        userId: meeting.userId,
        meetingId: meeting.id,
        bookingId: context.bookingId,
        reminderType: job.type,
        reminderAt: job.runAt,
        status: ReminderStatus.pending,
        attempts: 0,
      },
      update: {
        reminderAt: job.runAt,
        status: ReminderStatus.pending,
        attempts: 0,
        lastError: null,
      },
    });
  }
}

async function cancelReminders(context: WorkflowContext) {
  await prisma.reminderJob.updateMany({
    where: {
      bookingId: context.bookingId,
      status: { in: [ReminderStatus.pending, ReminderStatus.processing] },
    },
    data: {
      status: ReminderStatus.canceled,
      lastError: null,
    },
  });
}

export async function runForgeCalWorkflows(context: WorkflowContext) {
  if (context.eventName === "booking.confirmed") {
    await sendConfirmationEmail(context);
    await scheduleReminders(context);
    return;
  }

  if (context.eventName === "booking.canceled") {
    await sendCancellationEmail(context);
    await cancelReminders(context);
  }
}
