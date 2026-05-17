import express from "express";
import { getMe, login, logout, refresh, register } from "../controllers/auth.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export const authRouter = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates a user, then issues an access token (15 min) and a refresh
 *       token (7 days). Both tokens are also set as HTTP-only cookies
 *       (`accessToken`, `refreshToken`). Mobile clients should use the
 *       returned `token` value with the `Authorization: Bearer` header.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username: { type: string, example: alice }
 *               email: { type: string, format: email, example: alice@example.com }
 *               password: { type: string, format: password, example: hunter2! }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthSuccess' }
 *       400:
 *         description: Email or username already in use
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post("/register", register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with username or email
 *     description: |
 *       Accepts a username or email as `identifier`. Returns the access token
 *       in the response body and sets `accessToken` and `refreshToken`
 *       HTTP-only cookies.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email
 *                 example: alice
 *               password: { type: string, format: password }
 *     responses:
 *       201:
 *         description: Authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/AuthSuccess' }
 *       400:
 *         description: Missing identifier or password
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Invalid credentials }
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error: { type: string, example: Invalid credentials }
 */
authRouter.post("/login", login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate the access token
 *     description: |
 *       Reads the `refreshToken` cookie, invalidates it, and issues a fresh
 *       access/refresh token pair. The new access token is also returned in
 *       the response body for clients that prefer header-based auth.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: New tokens issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, description: New JWT access token }
 *       401:
 *         description: Missing, invalid, or expired refresh token
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.post("/refresh", refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out and clear auth cookies
 *     description: |
 *       Deletes the refresh token from the database (if present) and clears
 *       both `accessToken` and `refreshToken` cookies.
 *     security: []
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 message: { type: string, example: Logged out successfully }
 */
authRouter.post("/logout", logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: success }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
authRouter.get("/me", authMiddleware, getMe);
