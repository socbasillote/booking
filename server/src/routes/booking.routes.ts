import { Router } from "express";
import {
  createBooking,
  deleteBooking,
  listBookings,
  listPayments,
  recordBookingTransaction,
  updateBooking,
} from "../controllers/booking.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const bookingRouter = Router();
bookingRouter.use(requireAuth);
bookingRouter.get("/", listBookings);
bookingRouter.get("/payments", listPayments);
bookingRouter.post("/", createBooking);
bookingRouter.patch("/:id", updateBooking);
bookingRouter.delete("/:id", deleteBooking);
bookingRouter.post("/:id/transactions", recordBookingTransaction);
