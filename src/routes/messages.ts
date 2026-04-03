import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getMessages, sendMessage } from "../controllers/messages";

export const messagesRouter = Router();

messagesRouter.post("/:conversationId", authMiddleware, sendMessage);
messagesRouter.get("/:conversationId", authMiddleware, getMessages);
