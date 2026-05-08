import jwt from "jsonwebtoken";
import { Response } from "express";

export function generateAccessToken(userId: string, res: Response) {
  const isProd = process.env.NODE_ENV === "production";

  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
    expiresIn: "15m",
  });

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 1000 * 60 * 15,
  });

  return token;
}
