import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  editMessage,
  getMessages,
  readMessages,
  sendMessage,
} from "../controllers/messages";

export const messagesRouter = Router();

messagesRouter.post("/read", authMiddleware, readMessages);
messagesRouter.post("/:conversationId", authMiddleware, sendMessage);
messagesRouter.put("/:messageId", authMiddleware, editMessage);
messagesRouter.get("/:conversationId", authMiddleware, getMessages);
