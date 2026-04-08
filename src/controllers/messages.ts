import { Request, Response } from "express";
import { Message } from "../models/Message";
import { BadRequestError, NotFoundError } from "../utils/appError";

export async function sendMessage(req: Request, res: Response) {
  const { content } = req.body;

  await Message.create({
    conversationId: req.params.conversationId as string,
    sender: req.user!._id,
    content,
  });

  res.json({
    message: "Message sent successfully",
  });
}

export async function editMessage(req: Request, res: Response) {
  const { newMessage } = req.body;

  const messageId = req.params.id;

  const oldMessage = await Message.findById(messageId);

  if (!oldMessage) {
    throw new NotFoundError("Message is not found");
  }

  if (newMessage === oldMessage.content) {
    throw new BadRequestError("Content is the same");
  }

  await oldMessage.updateOne({ content: newMessage, isEdited: true });

  res.json({ message: "Message updated successfully" });
}

export async function deleteMessage(req: Request, res: Response) {
  const messageId = req.params.id;

  await Message.findByIdAndDelete(messageId);

  res.sendStatus(204);
}

export async function getMessages(req: Request, res: Response) {
  const { conversationId } = req.params;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (!conversationId) {
    throw new BadRequestError("Conversation ID is required");
  }

  const messages = await Message.find({
    conversationId,
  })
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ data: messages, meta: { page, limit } });
}

export async function readMessages(req: Request, res: Response) {
  const { messageIds } = req.body;

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      sender: { $ne: req.user!._id },
    },
    { read: true },
  );

  res.json({ message: "Messages are read" });
}
