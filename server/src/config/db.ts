import mongoose, { type ConnectOptions } from "mongoose";
import { env } from "./env.js";

let connectionPromise: Promise<typeof mongoose> | null = null;

const mongoOptions: ConnectOptions = {
  serverSelectionTimeoutMS: env.nodeEnv === "production" ? 15000 : 10000,
  retryWrites: true,
  maxPoolSize: 10,
  minPoolSize: 1,
  autoIndex: true,
};

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (mongoose.connection.readyState === 2 && connectionPromise) {
    await connectionPromise;
    return mongoose;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.mongoUri, mongoOptions)
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
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
