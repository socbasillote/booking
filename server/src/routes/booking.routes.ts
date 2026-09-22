import { Router } from "express";
import { createBooking, listBookings, updateBooking } from "../controllers/booking.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const bookingRouter = Router();
bookingRouter.use(requireAuth);
bookingRouter.get("/", listBookings);
bookingRouter.post("/", createBooking);
bookingRouter.patch("/:id", updateBooking);
