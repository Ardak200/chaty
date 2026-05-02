import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getUsers, uploadAvatar } from "../controllers/users.js";
import { upload } from "../utils/upload.js";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

usersRouter.get("/", getUsers);
usersRouter.put(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar,
);
