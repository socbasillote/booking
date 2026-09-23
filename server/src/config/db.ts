import mongoose from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri);
  }

  try {
    await connectionPromise;
    console.log("MongoDB connected");
    return mongoose;
  } catch (error) {
    connectionPromise = null;
    console.error("MongoDB connection failed:", error);
    throw error;
  }
}
