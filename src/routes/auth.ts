import express from "express";
import { getMe, login, logout, refresh, register } from "../controllers/auth";
import { authMiddleware } from "../middleware/authMiddleware";

export const authRouter = express.Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", authMiddleware, getMe);
