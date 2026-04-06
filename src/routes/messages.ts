import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  getMessages,
  readMessages,
  sendMessage,
} from "../controllers/messages";

export const messagesRouter = Router();

messagesRouter.post("/read", authMiddleware, readMessages);
messagesRouter.post("/:conversationId", authMiddleware, sendMessage);
messagesRouter.get("/:conversationId", authMiddleware, getMessages);
