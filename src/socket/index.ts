import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

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

    const token =
      socket.handshake.auth.token ||
      socket.handshake.query.token ||
      cookies.accessToken;

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

    socket.join("user:" + socket.data.user._id.toString());

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

          const populated = await message.populate("sender", "username");
          io.to(data.conversationId).emit("newMessage", populated);
        } catch (error) {
          console.error("sendMessage error:", error);
        }
      },
    );

    socket.on("call:offer", (data: { to: string; offer: any }) => {
      io.to(`user:${data.to}`).emit("call:offer", {
        from: socket.data.user._id.toString(),
        fromUsername: socket.data.user.username,
        offer: data.offer,
      });
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
