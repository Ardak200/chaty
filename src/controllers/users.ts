import { Request, Response } from "express";
import { User } from "../models/User";
import { BadRequestError } from "../utils/appError";
import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getS3 } from "../config/s3";

export async function getUsers(req: Request, res: Response) {
  const search = req.query.search as string | undefined;

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const filter = search ? { username: { $regex: search, $options: "i" } } : {};

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  res.json({ data: users, meta: { page, limit } });
}

export async function uploadAvatar(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    throw new BadRequestError("No file provided");
  }

  const user = await User.findById(req.user!._id);

  // delete old avatar from S3
  if (user?.avatar) {
    const oldKey = new URL(user.avatar).pathname.slice(1);
    await getS3().send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: oldKey,
      }),
    );
  }

  const key = `avatars/${req.user!._id}-${Date.now()}-${file.originalname}`;

  await getS3().send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  await User.findByIdAndUpdate(req.user!._id, { avatar: url });

  res.json({ avatar: url });
}
