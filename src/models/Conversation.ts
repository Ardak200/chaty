import mongoose from "mongoose";

interface IConversation {
  type: EConversationType;
  participants: mongoose.Types.ObjectId[];
  name?: string;
}

enum EConversationType {
  direct = "direct",
  group = "group",
}

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    name: {
      type: String,
    },
  },
  { timestamps: true },
);

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);
