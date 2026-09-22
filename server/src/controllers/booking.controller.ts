import type { Response } from "express";
import { z } from "zod";
import { Booking } from "../models/Booking.js";
import { syncCustomerFromBooking } from "../services/customer.service.js";
import { Service } from "../models/Service.js";
import type { AuthRequest } from "../middleware/auth.js";

const bookingSchema = z.object({
  customer: z.string().trim().min(2),
  email: z.string().email(),
  service: z.string().trim().min(2),
  staff: z.string().trim().min(2).default("Maria"),
  court: z.string().trim().min(1).default("Court 1"),
  date: z.string().min(8),
  time: z.string().regex(/^([01]\d|2[0-3]):(00|30)$/),
  status: z.enum(["Pending", "Confirmed", "Completed"]).default("Pending"),
  payment: z.enum(["Unpaid", "Deposit", "Paid"]),
  paymentMethod: z.enum([
    "Cash",
    "Card",
    "GCash",
    "Bank transfer",
    "PayPal",
    "PayMongo",
  ]),
});

export async function listBookings(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const bookings = await Booking.find({ businessId }).sort({
    date: 1,
    time: 1,
  });
  return res.json({ success: true, data: { bookings } });
}

export async function createBooking(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const payload = bookingSchema.parse(req.body);
  const service = await Service.findOne({
    businessId,
    name: payload.service,
  }).select("price");
  const confirmationCode = `SB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const booking = await Booking.create({
    ...payload,
    amount: Number(service?.price ?? 0),
    businessId,
    confirmationCode,
  });

  await syncCustomerFromBooking({
    businessId,
    name: payload.customer,
    email: payload.email,
  });

  return res.status(201).json({ success: true, data: { booking } });
}

export async function updateBooking(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const booking = await Booking.findOne({ _id: req.params.id, businessId });
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const payload = z
    .object({
      status: z
        .enum(["Pending", "Confirmed", "Completed", "Rejected"])
        .optional(),
      payment: z.enum(["Unpaid", "Deposit", "Paid"]).optional(),
      paymentMethod: z
        .enum([
          "Cash",
          "Card",
          "GCash",
          "Bank transfer",
          "PayPal",
          "PayMongo",
        ])
        .optional(),
    })
    .parse(req.body);

  Object.assign(booking, payload);
  await booking.save();

  return res.json({ success: true, data: { booking } });
}
