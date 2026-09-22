import { app } from "../src/app.js";
import { connectDatabase } from "../src/config/db.js";

let databasePromise: Promise<void> | null = null;

function ensureDatabaseConnection() {
  if (!databasePromise) {
    databasePromise = connectDatabase();
  }

  return databasePromise;
}

export default async function handler(req: any, res: any) {
  await ensureDatabaseConnection();
  return app(req, res);
}
