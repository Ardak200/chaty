import { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { BadRequestError } from "../utils/appError";

export async function createDirectConversation(req: Request, res: Response) {
  const { userId } = req.body;

  const conversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: [req.user?.id, userId] },
  });

  if (req.user?.id === userId) {
    throw new BadRequestError("You can't create a conversation with yourself");
  }

  if (!!conversation) {
    throw new BadRequestError(
      "The conversation between these two users already exists",
    );
  }

  await Conversation.create({
    type: "direct",
    participants: [req.user?.id, userId],
  });

  res.status(201).json({
    status: "success",
    message: "Conversation successfully created",
  });
}

export async function createGroupConversation(req: Request, res: Response) {
  const { participants } = req.body;

  await Conversation.create({
    type: "group",
    participants: [...participants, req.user?.id],
  });

  res.status(201).json({
    status: "success",
    message: "Conversation successfully created",
  });
}

export async function getAllUsersConversations(req: Request, res: Response) {
  const conversations = await Conversation.find({
    participants: req.user!.id,
  }).populate("participants", "username email");

  res.status(200).json({
    conversations,
  });
}
