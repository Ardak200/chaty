import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUsers } from "../controllers/users";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/", getUsers);
