type TemplateInput = {
  brandName: string;
  guestName: string;
  meetingStart: Date | null;
  timezone: string | null;
  meetingUrl: string | null;
  bookingId: string;
};

function formatMeetingDate(meetingStart: Date | null, timezone: string | null) {
  if (!meetingStart) return "TBD";
  try {
    return meetingStart.toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: timezone || "UTC",
    });
  } catch {
    return meetingStart.toISOString();
  }
}

function wrapTemplate(title: string, brandName: string, content: string) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0f172a,#1e293b);padding:20px 24px;color:#fff;">
        <p style="margin:0;font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.8;">${brandName}</p>
        <h1 style="margin:8px 0 0 0;font-size:24px;line-height:1.3;">${title}</h1>
      </div>
      <div style="padding:24px;">${content}</div>
      <div style="padding:18px 24px;border-top:1px solid #e2e8f0;color:#475569;font-size:12px;">
        This meeting flow is crafted and managed by ${brandName}.
      </div>
    </div>
  </div>`;
}

export function confirmationEmailTemplate(input: TemplateInput) {
  const when = formatMeetingDate(input.meetingStart, input.timezone);
  const content = `
    <p style="margin:0 0 14px 0;">Hi ${input.guestName},</p>
    <p style="margin:0 0 14px 0;">Your meeting is confirmed.</p>
    <p style="margin:0 0 6px 0;"><strong>Date & Time:</strong> ${when}</p>
    <p style="margin:0 0 6px 0;"><strong>Timezone:</strong> ${input.timezone || "UTC"}</p>
    <p style="margin:0 0 18px 0;"><strong>Booking ID:</strong> ${input.bookingId}</p>
    ${
      input.meetingUrl
        ? `<p style="margin:0 0 20px 0;"><a href="${input.meetingUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;">Join Meeting</a></p>`
        : ""
    }
    <p style="margin:0;">Looking forward to speaking with you.</p>
  `;

  return {
    subject: `${input.brandName} | Meeting Confirmed`,
    html: wrapTemplate("Meeting Confirmed", input.brandName, content),
    text: [
      `Hi ${input.guestName},`,
      `Your meeting is confirmed.`,
      `Date & Time: ${when}`,
      `Timezone: ${input.timezone || "UTC"}`,
      `Booking ID: ${input.bookingId}`,
      input.meetingUrl ? `Join: ${input.meetingUrl}` : "",
      `This meeting flow is crafted and managed by ${input.brandName}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function reminderEmailTemplate(input: TemplateInput, reminderLabel: string) {
  const when = formatMeetingDate(input.meetingStart, input.timezone);
  const content = `
    <p style="margin:0 0 14px 0;">Hi ${input.guestName},</p>
    <p style="margin:0 0 14px 0;">Quick reminder: your meeting is coming up ${reminderLabel}.</p>
    <p style="margin:0 0 6px 0;"><strong>Date & Time:</strong> ${when}</p>
    <p style="margin:0 0 6px 0;"><strong>Timezone:</strong> ${input.timezone || "UTC"}</p>
    <p style="margin:0 0 18px 0;"><strong>Booking ID:</strong> ${input.bookingId}</p>
    ${
      input.meetingUrl
        ? `<p style="margin:0 0 20px 0;"><a href="${input.meetingUrl}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;">Join Meeting</a></p>`
        : ""
    }
    <p style="margin:0;">See you soon.</p>
  `;

  return {
    subject: `${input.brandName} | Meeting Reminder`,
    html: wrapTemplate("Meeting Reminder", input.brandName, content),
    text: [
      `Hi ${input.guestName},`,
      `Reminder: your meeting is coming up ${reminderLabel}.`,
      `Date & Time: ${when}`,
      `Timezone: ${input.timezone || "UTC"}`,
      `Booking ID: ${input.bookingId}`,
      input.meetingUrl ? `Join: ${input.meetingUrl}` : "",
      `This meeting flow is crafted and managed by ${input.brandName}.`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export function cancellationEmailTemplate(input: TemplateInput) {
  const when = formatMeetingDate(input.meetingStart, input.timezone);
  const content = `
    <p style="margin:0 0 14px 0;">Hi ${input.guestName},</p>
    <p style="margin:0 0 14px 0;">Your meeting has been canceled.</p>
    <p style="margin:0 0 6px 0;"><strong>Original Date & Time:</strong> ${when}</p>
    <p style="margin:0 0 6px 0;"><strong>Timezone:</strong> ${input.timezone || "UTC"}</p>
    <p style="margin:0 0 18px 0;"><strong>Booking ID:</strong> ${input.bookingId}</p>
    <p style="margin:0;">If needed, you can book a new slot anytime.</p>
  `;

  return {
    subject: `${input.brandName} | Meeting Canceled`,
    html: wrapTemplate("Meeting Canceled", input.brandName, content),
    text: [
      `Hi ${input.guestName},`,
      `Your meeting has been canceled.`,
      `Original Date & Time: ${when}`,
      `Timezone: ${input.timezone || "UTC"}`,
      `Booking ID: ${input.bookingId}`,
      `This meeting flow is crafted and managed by ${input.brandName}.`,
    ].join("\n"),
  };
}

