import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer() {
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Sidebooking API running on port ${env.port}`);
  });

  try {
    await connectDatabase();
  } catch (error) {
    console.error("Database initialization failed:", error);
  }
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
