import { AppError } from "../utils/appError.js";
import { NextFunction, type Request, type Response } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  console.error(err);
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      message: err.message,
    });
  } else {
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
