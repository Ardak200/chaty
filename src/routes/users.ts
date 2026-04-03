import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { getUsers, uploadAvatar } from "../controllers/users";
import { upload } from "../utils/upload";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/", getUsers);
usersRouter.put("/avatar", authMiddleware, upload.single("file"), uploadAvatar);
