import type { Request, Response } from "express";
import { z } from "zod";
import QRCode from "qrcode";
import { Business } from "../models/Business.js";
import { Booking } from "../models/Booking.js";
import { syncCustomerFromBooking } from "../services/customer.service.js";
import { Service } from "../models/Service.js";
import { sendBookingConfirmation } from "../services/email.service.js";
import {
  createPayMongoCheckoutSession,
  getPayMongoCheckoutSessionStatus,
  isValidPayMongoSignature,
} from "../services/payment.service.js";

function minutesFromTime(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

const bookingSchema = z.object({
  customer: z.string().trim().min(2),
  email: z.string().email(),
  phone: z.string().trim().min(7),
  service: z.string().trim().min(2),
  staff: z.string().trim().min(2).default("Maria"),
  court: z.string().trim().min(1).default("Court 1").optional(),
  date: z.string().min(8),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .optional(),
  slots: z
    .array(
      z.object({
        court: z.string().trim().min(1),
        time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
      }),
    )
    .optional(),
  payment: z.enum(["Unpaid", "Deposit", "Paid"]).default("Unpaid"),
  paymentMethod: z.enum([
    "Cash",
    "Card",
    "GCash",
    "Bank transfer",
    "PayPal",
    "PayMongo",
  ]),
});

export async function getPublicBusiness(req: Request, res: Response) {
  const business = await Business.findOne({
    slug: req.params.slug,
    isActive: true,
  }).select(
    "name slug description openHour closeHour slotsPerHour slotIntervalMinutes isOpen24Hours courtsCount disabledCourts settings",
  );
  if (!business)
    return res
      .status(404)
      .json({ success: false, message: "Booking page not found" });

  const services = await Service.find({
    businessId: business._id,
    isActive: true,
    onlineBookingEnabled: true,
  })
    .sort({ name: 1 })
    .select("name price durationMinutes description");

  const bookings = await Booking.find({
    businessId: business._id,
    status: { $ne: "Rejected" },
  })
    .select("date time court")
    .lean();

  const slotsPerHour =
    business.slotsPerHour ?? business.settings?.booking?.slotsPerHour ?? 2;
  const slotIntervalMinutes =
    business.slotIntervalMinutes ??
    business.settings?.booking?.slotIntervalMinutes ??
    30;
  const courtsCount = business.courtsCount ?? 3;
  const isOpen24Hours =
    Boolean(business.isOpen24Hours) ||
    (business.openHour === "00:00" && business.closeHour === "23:30");
  const disabledCourts = Array.isArray(business.disabledCourts)
    ? business.disabledCourts
    : [];

  return res.json({
    success: true,
    data: {
      business: {
        name: business.name,
        slug: business.slug,
        description: business.description,
        openHour: business.openHour ?? "08:00",
        closeHour: business.closeHour ?? "20:00",
        slotsPerHour,
        slotIntervalMinutes,
        isOpen24Hours,
        courtsCount,
        disabledCourts,
      },
      services: services.map((service) => ({
        id: service._id.toString(),
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        description: service.description,
      })),
      bookings: bookings.map((booking) => ({
        date: booking.date,
        time: booking.time,
        court: booking.court,
      })),
    },
  });
}

export async function getBookingStatusByCode(req: Request, res: Response) {
  const confirmationCode = String(req.params.confirmationCode ?? "").trim();
  if (!confirmationCode) {
    return res
      .status(400)
      .json({ success: false, message: "Confirmation code is required." });
  }

  const booking = await Booking.findOne({ confirmationCode }).lean();
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking status not found." });
  }

  const business = await Business.findById(booking.businessId)
    .select("name settings")
    .lean();

  if (
    booking.paymentMethod === "PayMongo" &&
    booking.payment !== "Paid" &&
    booking.paymongoCheckoutSessionId
  ) {
    try {
      const paymentStatus = await getPayMongoCheckoutSessionStatus({
        checkoutSessionId: booking.paymongoCheckoutSessionId,
        secretKey: business?.settings?.payments?.paymongo?.secretKey,
      });
      if (paymentStatus?.toLowerCase() === "paid") {
        const paidBookings = await Booking.find({
          paymongoCheckoutSessionId: booking.paymongoCheckoutSessionId,
        });
        await Booking.updateMany(
          { paymongoCheckoutSessionId: booking.paymongoCheckoutSessionId },
          { $set: { payment: "Paid", status: "Confirmed" } },
        );

        const firstBooking = paidBookings[0] ?? booking;
        if (!firstBooking.confirmationEmailSentAt) {
          const email = await sendBookingConfirmation({
            to: firstBooking.email,
            customer: firstBooking.customer,
            business: business?.name ?? "Booking",
            service: firstBooking.service,
            date: firstBooking.date,
            time: paidBookings.map((entry) => entry.time).join(", "),
            paymentMethod: firstBooking.paymentMethod,
            payment: "Paid",
            confirmationCode: firstBooking.confirmationCode,
            statusPageUrl: `${process.env.CLIENT_URL ?? "http://localhost:5173"}/status/${firstBooking.confirmationCode}`,
          });
          if (email.delivered) {
            await Booking.updateMany(
              { paymongoCheckoutSessionId: booking.paymongoCheckoutSessionId },
              { $set: { confirmationEmailSentAt: new Date() } },
            );
          }
        }
        booking.payment = "Paid";
        booking.status = "Confirmed";
      }
    } catch (error) {
      console.error(
        `Unable to reconcile PayMongo checkout ${booking.paymongoCheckoutSessionId}.`,
        error,
      );
    }
  }

  const qr = await QRCode.toDataURL(confirmationCode, {
    margin: 1,
    width: 220,
  });

  return res.json({
    success: true,
    data: {
      booking: {
        id: String(booking._id),
        confirmationCode,
        customer: booking.customer,
        email: booking.email,
        service: booking.service,
        staff: booking.staff,
        date: booking.date,
        time: booking.time,
        payment: booking.payment,
        paymentMethod: booking.paymentMethod,
        status: booking.status,
        business: business?.name ?? "Booking",
      },
      qr,
      emailDelivered: Boolean(booking.confirmationEmailSentAt),
    },
  });
}

export async function createPublicBooking(req: Request, res: Response) {
  const input = bookingSchema.parse(req.body);
  const business = await Business.findOne({
    slug: req.params.slug,
    isActive: true,
  });
  if (!business)
    return res
      .status(404)
      .json({ success: false, message: "Booking page not found" });

  const isOpen24Hours =
    Boolean(business.isOpen24Hours) ||
    (business.openHour === "00:00" && business.closeHour === "23:30");
  const openMinutes = minutesFromTime(business.openHour ?? "08:00");
  const closeMinutes = isOpen24Hours
    ? 24 * 60
    : minutesFromTime(business.closeHour ?? "20:00");
  const slotIntervalMinutes =
    business.slotIntervalMinutes ??
    business.settings?.booking?.slotIntervalMinutes ??
    30;
  const disabledCourts = new Set(
    (business.disabledCourts ?? []).map((court) => court.trim()),
  );

  const chosenSlots = input.slots?.length
    ? input.slots
    : [{ court: input.court ?? "Court 1", time: input.time ?? "" }];

  if (!chosenSlots.length) {
    return res.status(400).json({
      success: false,
      message: "Choose at least one valid booking time.",
    });
  }

  for (const slot of chosenSlots) {
    if (disabledCourts.has(slot.court)) {
      return res.status(400).json({
        success: false,
        message: `Court ${slot.court} is currently unavailable for booking.`,
      });
    }

    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(slot.time)) {
      return res.status(400).json({
        success: false,
        message: "Choose a valid booking time in the business schedule.",
      });
    }

    const selectedMinutes = minutesFromTime(slot.time);
    if ((selectedMinutes - openMinutes) % slotIntervalMinutes !== 0) {
      return res.status(400).json({
        success: false,
        message: `Choose booking times in ${slotIntervalMinutes}-minute steps.`,
      });
    }

    if (selectedMinutes < openMinutes || selectedMinutes >= closeMinutes) {
      return res.status(400).json({
        success: false,
        message: "Booking time must be inside the business open hours.",
      });
    }
  }

  const normalizedPayment =
    input.paymentMethod === "PayPal" ? "Paid" : input.payment;

  const service = await Service.findOne({
    businessId: business._id,
    name: input.service,
    isActive: true,
    onlineBookingEnabled: true,
  }).select("price");
  const servicePrice = Number(service?.price ?? 0);
  if (!service) {
    return res.status(400).json({
      success: false,
      message: "This service is no longer available.",
    });
  }
  if (input.paymentMethod === "PayMongo" && servicePrice <= 0) {
    return res.status(400).json({
      success: false,
      message: "This service is not available for online payment.",
    });
  }

  const created = [];
  await syncCustomerFromBooking({
    businessId: business._id.toString(),
    name: input.customer,
    email: input.email,
    phone: input.phone,
  });

  for (const slot of chosenSlots) {
    const existing = await Booking.findOne({
      businessId: business._id,
      date: input.date,
      time: slot.time,
      court: slot.court,
      status: { $ne: "Rejected" },
    }).select("_id");

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `That date, court, and time is already fully booked: ${slot.court} ${slot.time}`,
      });
    }
  }

  for (const slot of chosenSlots) {
    const confirmationCode = `SB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const booking = await Booking.create({
      customer: input.customer,
      email: input.email,
      phone: input.phone,
      service: input.service,
      amount: servicePrice,
      staff: input.staff,
      court: slot.court,
      date: input.date,
      time: slot.time,
      payment: normalizedPayment,
      paymentMethod: input.paymentMethod,
      businessId: business._id,
      confirmationCode,
      status: "Pending",
    });

    created.push(booking);
  }

  if (input.paymentMethod === "PayMongo") {
    try {
      const firstBooking = created[0];
      const statusPageUrl = `${process.env.CLIENT_URL ?? "http://localhost:5173"}/status/${firstBooking.confirmationCode}`;
      const checkout = await createPayMongoCheckoutSession({
        amount: Math.round(servicePrice * 100) * created.length,
        description: `${business.name} - ${input.service}`,
        customerEmail: input.email,
        customerName: input.customer,
        customerPhone: input.phone,
        successUrl: statusPageUrl,
        cancelUrl: statusPageUrl,
        bookingIds: created.map((booking) => String(booking._id)),
        secretKey: business.settings?.payments?.paymongo?.secretKey,
      });
      await Booking.updateMany(
        { _id: { $in: created.map((booking) => booking._id) } },
        { $set: { paymongoCheckoutSessionId: checkout.id } },
      );
      return res.status(201).json({
        success: true,
        data: {
          booking: {
            id: firstBooking._id,
            confirmationCode: firstBooking.confirmationCode,
            status: firstBooking.status,
          },
          checkoutUrl: checkout.checkoutUrl,
        },
      });
    } catch (error) {
      await Booking.updateMany(
        { _id: { $in: created.map((booking) => booking._id) } },
        { $set: { status: "Rejected" } },
      );
      throw error;
    }
  }

  const firstBooking = created[0];

  return res.status(201).json({
    success: true,
    data: {
      booking: {
        id: firstBooking._id,
        confirmationCode: firstBooking.confirmationCode,
        status: firstBooking.status,
      },
      qr: await QRCode.toDataURL(firstBooking.confirmationCode, {
        margin: 1,
        width: 220,
      }),
      emailDelivered: false,
    },
  });
}

export async function handlePayMongoWebhook(req: Request, res: Response) {
  const payload = req.body as Buffer;
  const signature = req.header("x-paymongo-signature") ?? "";
  if (
    !Buffer.isBuffer(payload) ||
    !isValidPayMongoSignature(payload, signature)
  ) {
    console.error("PayMongo webhook rejected: invalid signature or body.");
    return res
      .status(400)
      .json({ success: false, message: "Invalid webhook signature." });
  }

  let event: {
    data?: {
      attributes?: {
        type?: string;
        data?: {
          id?: string;
          attributes?: { metadata?: Record<string, unknown> };
        };
      };
    };
  };
  try {
    event = JSON.parse(payload.toString("utf8")) as typeof event;
  } catch {
    console.error("PayMongo webhook rejected: invalid JSON body.");
    return res
      .status(400)
      .json({ success: false, message: "Invalid webhook body." });
  }

  const eventType = event.data?.attributes?.type ?? "";
  const resource = event.data?.attributes?.data;
  const checkoutSessionId = resource?.id;
  const metadataBookingIds = Object.values(
    resource?.attributes?.metadata ?? {},
  ).flatMap((value) =>
    typeof value === "string" ? value.split(",").map((id) => id.trim()) : [],
  );
  if (!checkoutSessionId || !eventType.includes("paid")) {
    console.info(`PayMongo webhook ignored: ${eventType || "unknown event"}.`);
    return res.json({ success: true });
  }

  const bookingFilter = {
    $or: [
      { paymongoCheckoutSessionId: checkoutSessionId },
      ...(metadataBookingIds.length
        ? [{ _id: { $in: metadataBookingIds } }]
        : []),
    ],
  };
  const bookings = await Booking.find(bookingFilter);
  if (
    !bookings.length ||
    bookings.every((booking) => booking.confirmationEmailSentAt)
  ) {
    console.error(
      `PayMongo paid webhook could not find pending bookings for ${checkoutSessionId}.`,
    );
    return res.json({ success: true });
  }

  await Booking.updateMany(bookingFilter, {
    $set: {
      payment: "Paid",
      status: "Confirmed",
    },
  });
  const firstBooking = bookings[0];
  const business = await Business.findById(firstBooking.businessId).select(
    "name",
  );
  const statusPageUrl = `${process.env.CLIENT_URL ?? "http://localhost:5173"}/status/${firstBooking.confirmationCode}`;
  const email = await sendBookingConfirmation({
    to: firstBooking.email,
    customer: firstBooking.customer,
    business: business?.name ?? "Booking",
    service: firstBooking.service,
    date: firstBooking.date,
    time: bookings.map((booking) => booking.time).join(", "),
    paymentMethod: firstBooking.paymentMethod,
    payment: "Paid",
    confirmationCode: firstBooking.confirmationCode,
    statusPageUrl,
  });
  if (email.delivered) {
    await Booking.updateMany(bookingFilter, {
      $set: { confirmationEmailSentAt: new Date() },
    });
    console.info(
      `PayMongo confirmation email sent for checkout ${checkoutSessionId}.`,
    );
  } else {
    console.error(
      `PayMongo payment confirmed but confirmation email delivery failed for checkout ${checkoutSessionId}.`,
    );
  }
  return res.json({ success: true });
}
