import nodemailer from "nodemailer";

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function parseBool(value: string | undefined, fallback: boolean) {
  if (typeof value !== "string") return fallback;
  return value.toLowerCase() === "true";
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || "";
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  const secure = parseBool(process.env.SMTP_SECURE, false);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "";

  if (!host || !port || !user || !pass || !from) {
    throw new Error(
      "SMTP is not fully configured. Required envs: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM."
    );
  }

  return { host, port, user, pass, secure, from };
}

export async function sendEmail(input: SendMailInput) {
  const config = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  return transporter.sendMail({
    from: config.from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

