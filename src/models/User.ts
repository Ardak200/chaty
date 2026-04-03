import mongoose from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  avatar?: string;
  username: string;
  email: string;
  password: string;
}

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
    },
  },
  {
    timestamps: true,
  },
);

export const User = mongoose.model<IUser>("User", userSchema);
