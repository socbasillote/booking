import mongoose from "mongoose";
import { env } from "./env.js";

let isConnecting = false;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (isConnecting) {
    return;
  }

  isConnecting = true;

  try {
    await mongoose.connect(env.mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  } finally {
    isConnecting = false;
  }
}
