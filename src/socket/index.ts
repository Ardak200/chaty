import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { sendExpoPush, type ExpoPushMessage } from "../utils/expoPush.js";

type PendingCallOffer = {
  from: string;
  fromUsername: string;
  offer: unknown;
  expiresAt: number;
};

const CALL_OFFER_TTL_MS = 30_000;
const pendingCallOffers = new Map<string, PendingCallOffer>();

function isUserOnline(io: Server, userId: string): boolean {
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return !!room && room.size > 0;
}

async function getPushTokensForUsers(userIds: string[]): Promise<
  Map<string, string[]>
> {
  if (userIds.length === 0) return new Map();
  const users = await User.find({ _id: { $in: userIds } })
    .select("+pushTokens")
    .lean();
  const map = new Map<string, string[]>();
  for (const u of users) {
    map.set(
      u._id.toString(),
      (u.pushTokens ?? []).map((t) => t.token),
    );
  }
  return map;
}

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (_origin, callback) => {
        // Allow all origins
        callback(null, true);
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");

    const token = cookies.accessToken;

    if (!token) return next(new Error("No token provided"));

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as jwt.JwtPayload;

      const user = await User.findById(decoded.id);

      if (!user) return next(new Error("User not found"));

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log("User connected:", socket.data.user.username);

    const conversations = await Conversation.find({
      participants: socket.data.user._id,
    });

    for (const conv of conversations) {
      socket.join(conv._id.toString());
    }

    const userId = socket.data.user._id.toString();
    socket.join("user:" + userId);

    const pending = pendingCallOffers.get(userId);
    if (pending && pending.expiresAt > Date.now()) {
      socket.emit("call:offer", {
        from: pending.from,
        fromUsername: pending.fromUsername,
        offer: pending.offer,
      });
    }
    pendingCallOffers.delete(userId);

    socket.on("joinConversation", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on(
      "sendMessage",
      async (data: { conversationId: string; content: string }) => {
        try {
          const message = await Message.create({
            conversationId: data.conversationId,
            sender: socket.data.user._id,
            content: data.content,
          });

          const populated = await message.populate("sender", "username avatar");
          io.to(data.conversationId).emit("newMessage", populated);

          const conv = await Conversation.findById(data.conversationId).select(
            "participants",
          );
          if (!conv) return;
          const senderId = socket.data.user._id.toString();
          const offline = conv.participants
            .map((p) => p.toString())
            .filter((id) => id !== senderId && !isUserOnline(io, id));
          if (offline.length === 0) return;

          const tokensByUser = await getPushTokensForUsers(offline);
          const messages: ExpoPushMessage[] = [];
          for (const tokens of tokensByUser.values()) {
            for (const token of tokens) {
              messages.push({
                to: token,
                title: socket.data.user.username,
                body: data.content,
                channelId: "messages",
                data: {
                  type: "message",
                  conversationId: data.conversationId,
                  messageId: message._id.toString(),
                },
              });
            }
          }
          void sendExpoPush(messages);
        } catch (error) {
          console.error("sendMessage error:", error);
        }
      },
    );

    socket.on("call:offer", async (data: { to: string; offer: any }) => {
      const fromId = socket.data.user._id.toString();
      const fromUsername = socket.data.user.username as string;

      io.to(`user:${data.to}`).emit("call:offer", {
        from: fromId,
        fromUsername,
        offer: data.offer,
      });

      if (isUserOnline(io, data.to)) return;

      pendingCallOffers.set(data.to, {
        from: fromId,
        fromUsername,
        offer: data.offer,
        expiresAt: Date.now() + CALL_OFFER_TTL_MS,
      });

      const tokensByUser = await getPushTokensForUsers([data.to]);
      const tokens = tokensByUser.get(data.to) ?? [];
      if (tokens.length === 0) return;

      const messages: ExpoPushMessage[] = tokens.map((token) => ({
        to: token,
        title: fromUsername,
        body: "Incoming call",
        channelId: "calls",
        priority: "high",
        sound: "default",
        data: { type: "call", callerId: fromId },
      }));
      void sendExpoPush(messages);
    });

    socket.on("call:answer", (data: { to: string; answer: any }) => {
      io.to(`user:${data.to}`).emit("call:answer", {
        from: socket.data.user._id.toString(),
        answer: data.answer,
      });
    });

    socket.on("call:ice", (data: { to: string; candidate: any }) => {
      io.to(`user:${data.to}`).emit("call:ice", {
        from: socket.data.user._id.toString(),
        candidate: data.candidate,
      });
    });

    socket.on("call:end", (data: { to: string }) => {
      pendingCallOffers.delete(data.to);
      io.to(`user:${data.to}`).emit("call:end", {
        from: socket.data.user._id.toString(),
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.user.username}`);
    });
  });

  return io;
}
