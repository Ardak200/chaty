import mongoose from "mongoose";

export async function connectDB() {
  const connectionString = process.env.MONGODB_URI as string;

  try {
    await mongoose.connect(connectionString);
    console.log("Successfully connected to db");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
