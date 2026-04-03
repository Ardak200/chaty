import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User";
import { generateAccessToken } from "../utils/generateAccessToken";
import { generateRefreshToken } from "../utils/generateRefreshToken";
import { BadRequestError, UnauthorizedError } from "../utils/appError";
import { RefreshToken } from "../models/RefreshToken";

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new BadRequestError("User with this email already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({ username, email, password: hashedPassword });

  const accessToken = generateAccessToken(user.id, res);
  await generateRefreshToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token: accessToken,
    },
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ error: "Invalid email or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user.id, res);
  await generateRefreshToken(user.id, res);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      token: accessToken,
    },
  });
}

export const refresh = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new UnauthorizedError("No refresh token provided");
  }

  const storedToken = await RefreshToken.findOne({
    token,
  });

  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken) {
      await RefreshToken.deleteOne({ token });
    }

    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  await RefreshToken.deleteOne({ token });

  const accessToken = generateAccessToken(storedToken.userId.toString(), res);
  await generateRefreshToken(storedToken.userId.toString(), res);

  res.status(200).json({
    status: "success",
    data: { token: accessToken },
  });
};

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken;

  if (token) {
    await RefreshToken.deleteMany({ token });
  }

  res.cookie("accessToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.cookie("refreshToken", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};

export async function getMe(req: Request, res: Response) {
  const user = req.user!;
  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    },
  });
}
