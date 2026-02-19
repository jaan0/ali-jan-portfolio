import crypto from "crypto";
import { NextResponse } from "next/server";
import { getForgeCalServerConfig } from "@/lib/forgecal";

function verifySignature(rawBody: string, signature: string, secret: string) {
  const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expected = Buffer.from(digest, "utf8");
  const received = Buffer.from(signature, "utf8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}

export async function POST(request: Request) {
  const config = await getForgeCalServerConfig();
  const secret = config.webhookSecret;

  if (!secret) {
    return NextResponse.json(
      { error: "ForgeCal webhook secret is not configured in admin profile or env." },
      { status: 500 }
    );
  }

  const event = request.headers.get("x-forgecal-event");
  const signature = request.headers.get("x-forgecal-signature");

  if (!event || !signature) {
    return NextResponse.json({ error: "Missing webhook headers." }, { status: 400 });
  }

  const rawBody = await request.text();
  const isValid = verifySignature(rawBody, signature, secret);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let payload: unknown = null;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = rawBody;
  }

  console.log("[ForgeCal webhook]", { event, payload });

  return NextResponse.json({ ok: true });
}
