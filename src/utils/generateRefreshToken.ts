import crypto from "crypto";
import { Response } from "express";
import { RefreshToken } from "../models/RefreshToken.js";

export async function generateRefreshToken(userId: string, res: Response) {
  const token = crypto.randomBytes(40).toString("hex");

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await RefreshToken.create({
    expiresAt,
    token,
    userId,
  });

  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
}
