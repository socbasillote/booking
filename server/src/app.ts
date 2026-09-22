import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { authRouter } from "./routes/auth.routes.js";
import { bookingRouter } from "./routes/booking.routes.js";
import { businessRouter } from "./routes/business.routes.js";
import { customerRouter } from "./routes/customer.routes.js";
import { publicRouter } from "./routes/public.routes.js";
import { serviceRouter } from "./routes/service.routes.js";
import { teamRouter } from "./routes/team.routes.js";
import { handlePayMongoWebhook } from "./controllers/public.controller.js";

export const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(helmet());
app.post(
  "/api/payments/paymongo/webhook",
  express.raw({ type: "application/json" }),
  handlePayMongoWebhook,
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", app: "sidebooking" } });
});

app.use("/api/auth", authRouter);
app.use("/api/business", businessRouter);
app.use("/api/public", publicRouter);
app.use("/api/services", serviceRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/customers", customerRouter);
app.use("/api/team", teamRouter);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: err.issues.map((issue) => issue.message),
      });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  },
);
