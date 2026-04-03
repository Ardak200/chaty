import { Request, Response } from "express";
import { Message } from "../models/Message";
import { BadRequestError } from "../utils/appError";

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
