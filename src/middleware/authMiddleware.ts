import { NextFunction, type Request, type Response } from "express";
import { UnauthorizedError } from "../utils/appError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    throw new UnauthorizedError("Not authorized, no token provided");
  }

  let decoded: jwt.JwtPayload;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Access token expired");
    }

    if (err instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError("Invalid token");
    }

    throw err;
  }

  const user = await User.findOne({ _id: decoded.id });

  if (!user) {
    throw new UnauthorizedError("User no longer exists");
  }

  req.user = user;
  next();
}
