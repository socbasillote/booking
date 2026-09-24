import type { Request, Response } from "express";
import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

let databaseReady: Promise<unknown> | null = null;

export default async function handler(req: Request, res: Response) {
  databaseReady ??= connectDatabase();

  try {
    await databaseReady;
  } catch (error) {
    databaseReady = null;

    console.error("Database initialization failed:", error);

    return res.status(503).json({
      success: false,
      message: "Database unavailable",
    });
  }

  return app(req, res);
}
