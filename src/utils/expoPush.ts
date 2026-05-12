import { User } from "../models/User.js";

export type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  channelId?: string;
  priority?: "default" | "normal" | "high";
  sound?: "default" | null;
};

type ExpoTicket =
  | { status: "ok"; id: string }
  | {
      status: "error";
      message: string;
      details?: { error?: string };
    };

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  let res: Response;
  try {
    res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.error("[expoPush] network error", err);
    return;
  }

  if (!res.ok) {
    console.error("[expoPush] http", res.status, await res.text());
    return;
  }

  const json = (await res.json()) as { data: ExpoTicket[] };
  const stale: string[] = [];
  json.data.forEach((ticket, i) => {
    if (ticket.status === "error") {
      console.warn("[expoPush] ticket error", ticket.message, ticket.details);
      const message = messages[i];
      if (ticket.details?.error === "DeviceNotRegistered" && message) {
        stale.push(message.to);
      }
    }
  });

  if (stale.length > 0) {
    await User.updateMany(
      { "pushTokens.token": { $in: stale } },
      { $pull: { pushTokens: { token: { $in: stale } } } },
    ).catch((err) => console.error("[expoPush] failed to prune stale", err));
  }
}
