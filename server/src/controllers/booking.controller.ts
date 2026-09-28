import type { Response } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
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
  status: z
    .enum(["Pending", "Confirmed", "Completed", "Rejected"])
    .default("Pending"),
});

const paymentMethodSchema = z.enum([
  "Cash",
  "Card",
  "GCash",
  "Bank transfer",
  "PayPal",
  "PayMongo",
]);

export async function listBookings(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const bookings = await Booking.find({ businessId, archivedAt: null }).sort({
    date: 1,
    time: 1,
  });
  return res.json({ success: true, data: { bookings } });
}

export async function listPayments(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const payments = await Booking.find({
    businessId,
    $or: [
      { archivedAt: null },
      { amountPaid: { $gt: 0 } },
      { amountRefunded: { $gt: 0 } },
      { transactions: { $exists: true, $not: { $size: 0 } } },
    ],
  }).sort({ createdAt: -1 });
  return res.json({ success: true, data: { payments } });
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
    payment: "Unpaid",
    paymentMethod: "Cash",
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

  const payload = bookingSchema.partial().parse(req.body);

  if (payload.service) {
    const service = await Service.findOne({
      businessId,
      name: payload.service,
    }).select("price");
    if (!service) {
      return res
        .status(400)
        .json({ success: false, message: "Service not found" });
    }
    booking.amount = Number(service.price ?? 0);
  }

  Object.assign(booking, payload);
  await booking.save();

  return res.json({ success: true, data: { booking } });
}

export async function deleteBooking(req: AuthRequest, res: Response) {
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

  booking.archivedAt = new Date();
  await booking.save();

  return res.json({ success: true, data: { booking } });
}

export async function recordBookingTransaction(
  req: AuthRequest,
  res: Response,
) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const { type, amount, method } = z
    .object({
      type: z.enum(["Charge", "Refund"]),
      amount: z.number().positive(),
      method: paymentMethodSchema,
    })
    .parse(req.body);
  const booking = await Booking.findOne({ _id: req.params.id, businessId });
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const paid =
    booking.amountPaid || (booking.payment === "Paid" ? booking.amount : 0);
  if (type === "Charge" && paid + amount > booking.amount) {
    return res.status(400).json({
      success: false,
      message: "The charge cannot exceed the outstanding balance",
    });
  }
  if (type === "Refund" && amount > paid) {
    return res.status(400).json({
      success: false,
      message: "The refund cannot exceed the amount collected",
    });
  }

  const nextPaid = type === "Charge" ? paid + amount : paid - amount;
  booking.amountPaid = nextPaid;
  booking.amountRefunded =
    (booking.amountRefunded ?? 0) + (type === "Refund" ? amount : 0);
  booking.paymentMethod = method;
  booking.payment =
    nextPaid <= 0
      ? booking.amountRefunded > 0
        ? "Unpaid"
        : "Unpaid"
      : nextPaid >= booking.amount
        ? "Paid"
        : "Deposit";
  booking.transactions.push({
    type,
    amount,
    method,
    reference: `${type === "Charge" ? "CHG" : "REF"}-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date(),
  });
  await booking.save();

  return res.json({ success: true, data: { booking } });
}
