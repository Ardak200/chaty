import { Router } from "express";
import {
  createDirectConversation,
  createGroupConversation,
  getAllUsersConversations,
} from "../controllers/conversations.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const conversationsRouter = Router();

conversationsRouter.use(authMiddleware);

/**
 * @openapi
 * /conversations/direct:
 *   post:
 *     tags: [Conversations]
 *     summary: Create a direct (1-to-1) conversation
 *     description: |
 *       Fails if the conversation already exists or the target user is the
 *       caller themselves.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The other participant's user id
 *                 example: 67120a3e1c2d8e5f4a9b1234
 *     responses:
 *       201:
 *         description: Conversation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Conversation successfully created }
 *       400:
 *         description: Conversation already exists or self-conversation
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
conversationsRouter.post("/direct", createDirectConversation);

/**
 * @openapi
 * /conversations/group:
 *   post:
 *     tags: [Conversations]
 *     summary: Create a group conversation
 *     description: |
 *       The caller is added to `participants` automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [participants]
 *             properties:
 *               participants:
 *                 type: array
 *                 items: { type: string }
 *                 description: User ids of the other group members
 *                 example: ["67120a3e1c2d8e5f4a9b1234", "67120a3e1c2d8e5f4a9b5678"]
 *     responses:
 *       201:
 *         description: Conversation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Conversation successfully created }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
conversationsRouter.post("/group", createGroupConversation);

/**
 * @openapi
 * /conversations:
 *   get:
 *     tags: [Conversations]
 *     summary: List the caller's conversations
 *     description: |
 *       Returns every conversation where the caller is a participant.
 *       `participants` are populated with `username` and `email`.
 *     responses:
 *       200:
 *         description: Conversation list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 conversations:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Conversation' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
conversationsRouter.get("/", getAllUsersConversations);
