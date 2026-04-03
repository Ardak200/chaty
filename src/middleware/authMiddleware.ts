import { NextFunction, type Request, type Response } from "express";
import { UnauthorizedError } from "../utils/appError";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

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

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

  const user = await User.findOne({ _id: decoded.id });

  if (!user) {
    throw new UnauthorizedError("User no longer exists");
  }

  req.user = user;
  next();
}
