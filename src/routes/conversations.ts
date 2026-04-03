import { Router } from "express";
import {
  createDirectConversation,
  createGroupConversation,
  getAllUsersConversations,
} from "../controllers/conversations";
import { authMiddleware } from "../middleware/authMiddleware";

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware);

conversationsRouter.post("/direct", createDirectConversation);
conversationsRouter.post("/group", createGroupConversation);
conversationsRouter.get("/", getAllUsersConversations);
