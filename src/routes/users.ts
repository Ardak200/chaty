import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  getUsers,
  registerPushToken,
  uploadAvatar,
} from "../controllers/users.js";
import { upload } from "../utils/upload.js";

export const usersRouter = Router();

usersRouter.use(authMiddleware);

/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List or search users
 *     description: |
 *       Returns a paginated list of users. When `search` is provided, results
 *       are filtered by case-insensitive substring match on `username`.
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Substring to match against username (case-insensitive)
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated user list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/User' }
 *                 meta: { $ref: '#/components/schemas/Pagination' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
usersRouter.get("/", getUsers);

/**
 * @openapi
 * /users/avatar:
 *   put:
 *     tags: [Users]
 *     summary: Upload or replace the caller's avatar
 *     description: |
 *       Uploads a new avatar image to S3 and updates the user record. If the
 *       user already had an avatar, the previous object is deleted from the
 *       bucket.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   format: uri
 *                   example: https://chaty.s3.eu-central-1.amazonaws.com/avatars/...
 *       400:
 *         description: No file provided
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
usersRouter.put(
  "/avatar",
  authMiddleware,
  upload.single("avatar"),
  uploadAvatar,
);

/**
 * @openapi
 * /users/me/push-tokens:
 *   post:
 *     tags: [Users]
 *     summary: Register an Expo push token for the current device
 *     description: |
 *       Stores or refreshes a push notification token for the authenticated
 *       user. The same token registered on a different account is moved
 *       automatically.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, platform]
 *             properties:
 *               token:
 *                 type: string
 *                 example: ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
 *               platform:
 *                 type: string
 *                 enum: [ios, android]
 *     responses:
 *       204:
 *         description: Token stored
 *       400:
 *         description: Missing or invalid token/platform
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
usersRouter.post("/me/push-tokens", registerPushToken);
