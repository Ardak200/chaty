import { Request, Response } from "express";
import { User } from "../models/User";

export async function getUsers(req: Request, res: Response) {
  const search = req.query.search as string | undefined;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filter = search
    ? { username: { $regex: search, $options: "i" } }
    : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ data: users, meta: { page, limit } });
}
