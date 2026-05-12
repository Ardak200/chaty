import mongoose from "mongoose";

export type PushPlatform = "ios" | "android";

export interface IPushToken {
  token: string;
  platform: PushPlatform;
  updatedAt: Date;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  avatar?: string;
  username: string;
  email: string;
  password: string;
  pushTokens: IPushToken[];
}

const pushTokenSchema = new mongoose.Schema<IPushToken>(
  {
    token: { type: String, required: true },
    platform: { type: String, enum: ["ios", "android"], required: true },
  },
  { _id: false, timestamps: { createdAt: false, updatedAt: true } },
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    password: {
      type: String,
      required: true,
      select: false,
    },
    pushTokens: {
      type: [pushTokenSchema],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
        delete ret.pushTokens;
        return ret;
      },
    },
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
