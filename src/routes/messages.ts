import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  deleteMessage,
  editMessage,
  getMessages,
  readMessages,
  sendMessage,
} from "../controllers/messages";

export const messagesRouter = Router();

messagesRouter.post("/read", authMiddleware, readMessages);
messagesRouter.post("/:conversationId", authMiddleware, sendMessage);
messagesRouter.put("/:id", authMiddleware, editMessage);
messagesRouter.delete("/:id", authMiddleware, deleteMessage);
messagesRouter.get("/:conversationId", authMiddleware, getMessages);
