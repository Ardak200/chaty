import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!,
      ) as jwt.JwtPayload;
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("User not found"));
      }

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`User connected: ${socket.data.user.username}`);

    const conversations = await Conversation.find({
      participants: socket.data.user._id,
    });

    for (const conversation of conversations) {
      socket.join(conversation._id.toString());
    }

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
        } catch (err) {
          console.error("sendMessage error:", err);
        }
      },
    );

    socket.on("joinConversation", (conversationId: string) => {
      socket.join(conversationId);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.user.username}`);
    });
  });

  return io;
}
