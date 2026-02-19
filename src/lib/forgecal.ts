const DEFAULT_FORGECAL_BASE_URL = "https://forge-cal.vercel.app";
import prisma from "@/lib/prisma";

export type ForgeCalConfig = {
  baseUrl: string;
  apiKey: string;
  eventSlug: string;
  webhookSecret: string;
};

async function getForgeCalConfig(): Promise<ForgeCalConfig> {
  const user = await prisma.user.findFirst({
    where: { email: "admin@example.com" },
    select: {
      forgeCalApiKey: true,
      forgeCalEventSlug: true,
      forgeCalWebhookSecret: true,
      forgeCalBaseUrl: true,
    },
  });

  const baseUrl =
    user?.forgeCalBaseUrl || process.env.FORGECAL_BASE_URL || DEFAULT_FORGECAL_BASE_URL;
  const apiKey = user?.forgeCalApiKey || process.env.FORGECAL_API_KEY || "";
  const eventSlug = user?.forgeCalEventSlug || process.env.FORGECAL_EVENT_SLUG || "strategy-call";
  const webhookSecret = user?.forgeCalWebhookSecret || process.env.FORGECAL_WEBHOOK_SECRET || "";

  if (!apiKey) {
    throw new Error("ForgeCal API key is not configured in admin profile or env.");
  }

  return { baseUrl, apiKey, eventSlug, webhookSecret };
}

export async function forgeCalRequest(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: unknown }> {
  const { baseUrl, apiKey } = await getForgeCalConfig();
  const url = `${baseUrl}${path}`;

  const headers = new Headers(init.headers || {});
  headers.set("x-api-key", apiKey);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return { status: response.status, data };
}

export async function getForgeCalServerConfig() {
  return getForgeCalConfig();
}
