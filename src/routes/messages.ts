import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  deleteMessage,
  editMessage,
  getMessages,
  readMessages,
  sendMessage,
} from "../controllers/messages.js";

export const messagesRouter = Router();

/**
 * @openapi
 * /messages/read:
 *   post:
 *     tags: [Messages]
 *     summary: Mark messages as read
 *     description: |
 *       Marks every message in `messageIds` as `read: true`, except those the
 *       caller authored. Useful when a conversation is opened on the client.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [messageIds]
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["67120c4d1c2d8e5f4a9b9abc"]
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Messages are read }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
messagesRouter.post("/read", authMiddleware, readMessages);

/**
 * @openapi
 * /messages/{conversationId}:
 *   post:
 *     tags: [Messages]
 *     summary: Send a message via REST
 *     description: |
 *       Persists a message in the given conversation. Note: real-time
 *       delivery to other participants happens through the Socket.IO
 *       `sendMessage` event (see SOCKET.md). This REST endpoint only stores
 *       the message — it does not broadcast.
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: Hello! }
 *     responses:
 *       200:
 *         description: Message stored
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Message sent successfully }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
messagesRouter.post("/:conversationId", authMiddleware, sendMessage);

/**
 * @openapi
 * /messages/{id}:
 *   put:
 *     tags: [Messages]
 *     summary: Edit a message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newMessage]
 *             properties:
 *               newMessage: { type: string, example: Updated text }
 *     responses:
 *       200:
 *         description: Message updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string, example: Message updated successfully }
 *       400:
 *         description: New content matches the current content
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404:
 *         description: Message not found
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *   delete:
 *     tags: [Messages]
 *     summary: Delete a message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204: { description: Message deleted }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
messagesRouter.put("/:id", authMiddleware, editMessage);
messagesRouter.delete("/:id", authMiddleware, deleteMessage);

/**
 * @openapi
 * /messages/{conversationId}:
 *   get:
 *     tags: [Messages]
 *     summary: List messages in a conversation
 *     description: |
 *       Returns messages sorted newest-first, paginated. `sender` is
 *       populated with `username`.
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Message' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       400:
 *         description: Missing conversationId
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
messagesRouter.get("/:conversationId", authMiddleware, getMessages);
