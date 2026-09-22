import { Router } from "express";
import {
  createPublicBooking,
  getBookingStatusByCode,
  getPublicBusiness,
} from "../controllers/public.controller.js";

export const publicRouter = Router();
publicRouter.get("/status/:confirmationCode", getBookingStatusByCode);
publicRouter.get("/:slug", getPublicBusiness);
publicRouter.post("/:slug/bookings", createPublicBooking);
