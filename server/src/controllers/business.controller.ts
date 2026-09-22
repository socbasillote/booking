import type { Response } from "express";
import { z } from "zod";
import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";

const settingsSchema = z
  .object({
    booking: z
      .object({
        slotsPerHour: z.number().int().min(1).max(12).optional(),
        slotIntervalMinutes: z.number().int().min(15).max(180).optional(),
        isOpen24Hours: z.boolean().optional(),
        courtsCount: z.number().int().min(1).optional(),
        bookingTypes: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              description: z.string().trim().optional(),
              active: z.boolean().default(true),
              displayOrder: z.number().int().nonnegative().default(1),
            }),
          )
          .optional(),
        bookingStatuses: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              color: z.string().trim().optional(),
              active: z.boolean().default(true),
              displayOrder: z.number().int().nonnegative().default(1),
            }),
          )
          .optional(),
        confirmationRules: z
          .object({
            rule: z.string().trim().default("Confirm after deposit payment"),
            expireUnpaidAfterHours: z.number().int().min(1).optional(),
            autoConfirm: z.boolean().default(false),
          })
          .optional(),
        cancellationRules: z
          .object({
            allowCustomerCancellation: z.boolean().default(true),
            cancellationDeadlineDays: z.number().int().min(0).optional(),
            refundRule: z.string().trim().default("Full"),
            staffApprovalRequired: z.boolean().default(false),
          })
          .optional(),
        reschedulingRules: z
          .object({
            allowRescheduling: z.boolean().default(true),
            maxReschedules: z.number().int().min(0).optional(),
            rescheduleDeadlineDays: z.number().int().min(0).optional(),
            rescheduleFee: z.number().min(0).optional(),
            requireStaffApproval: z.boolean().default(false),
          })
          .optional(),
      })
      .optional(),
    payments: z
      .object({
        paymongo: z
          .object({
            secretKey: z.string().trim().min(1).optional(),
          })
          .optional(),
        paymentTypes: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              description: z.string().trim().optional(),
              active: z.boolean().default(true),
              displayOrder: z.number().int().nonnegative().default(1),
            }),
          )
          .optional(),
        paymentStatuses: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              active: z.boolean().default(true),
              displayOrder: z.number().int().nonnegative().default(1),
            }),
          )
          .optional(),
        depositRules: z
          .object({
            type: z.string().trim().default("Percentage"),
            percentage: z.number().min(0).max(100).optional(),
            fixedAmount: z.number().min(0).optional(),
            depositDue: z.string().trim().default("At booking"),
            balanceDue: z.string().trim().default("Before booking"),
            refundRule: z.string().trim().default("Fully refundable"),
            refundDeadlineDays: z.number().int().min(0).optional(),
          })
          .optional(),
        paymentDueRules: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              daysBefore: z.number().int().min(0),
              active: z.boolean().default(true),
            }),
          )
          .optional(),
        refundRules: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              active: z.boolean().default(true),
            }),
          )
          .optional(),
      })
      .optional(),
    notifications: z
      .object({
        bookingNotifications: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              active: z.boolean().default(true),
            }),
          )
          .optional(),
        paymentNotifications: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              active: z.boolean().default(true),
            }),
          )
          .optional(),
        reminders: z
          .array(
            z.object({
              name: z.string().trim().min(1),
              active: z.boolean().default(true),
            }),
          )
          .optional(),
      })
      .optional(),
    automation: z
      .object({
        autoConfirm: z.boolean().default(false),
        autoCancel: z.boolean().default(false),
        paymentOverdue: z.boolean().default(true),
        noShow: z.boolean().default(true),
        followUp: z.boolean().default(true),
      })
      .optional(),
  })
  .optional();

function businessResponse(business: any) {
  const response = business.toObject ? business.toObject() : { ...business };
  const secretKey = response.settings?.payments?.paymongo?.secretKey;

  if (response.settings?.payments?.paymongo) {
    response.settings.payments.paymongo = secretKey
      ? { configured: true, keyLast4: secretKey.slice(-4) }
      : { configured: false };
  }

  return response;
}

const businessSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(500).optional().default(""),
  openHour: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .default("08:00"),
  closeHour: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .default("20:00"),
  slotsPerHour: z.number().int().min(1).max(12).optional().default(2),
  slotIntervalMinutes: z.number().int().min(15).max(180).optional().default(30),
  isOpen24Hours: z.boolean().optional().default(false),
  courtsCount: z.number().int().min(1).optional().default(3),
  disabledCourts: z.array(z.string().trim().min(1)).optional().default([]),
  settings: settingsSchema.optional(),
});

export async function getBusiness(req: AuthRequest, res: Response) {
  const user = await User.findById(req.userId);
  const business = user?.businessIds?.[0]
    ? await Business.findById(user.businessIds[0])
    : null;
  return res.json({
    success: true,
    data: { business: business ? businessResponse(business) : null },
  });
}

export async function saveBusiness(req: AuthRequest, res: Response) {
  const input = businessSchema.parse(req.body);
  const user = await User.findById(req.userId);
  if (!user)
    return res.status(404).json({ success: false, message: "User not found" });

  let business = user.businessIds[0]
    ? await Business.findById(user.businessIds[0])
    : null;
  const slotIntervalMinutes = input.slotIntervalMinutes ?? 30;
  const isOpen24Hours =
    Boolean(input.isOpen24Hours) ||
    (input.openHour === "00:00" && input.closeHour === "23:30");
  const normalizedOpenHour = isOpen24Hours ? "00:00" : input.openHour;
  const normalizedCloseHour = isOpen24Hours ? "23:30" : input.closeHour;
  const slotsPerHour = input.slotsPerHour ?? 2;
  const validCourtNames = Array.from(
    { length: Math.max(1, input.courtsCount ?? 3) },
    (_, index) => `Court ${index + 1}`,
  );
  const disabledCourts = [
    ...new Set(
      (input.disabledCourts ?? []).map((court) => court.trim()).filter(Boolean),
    ),
  ].filter((court) => validCourtNames.includes(court));
  const defaultSettings = {
    booking: {
      slotIntervalMinutes: 30,
      isOpen24Hours: false,
      bookingTypes: [
        {
          name: "Appointment",
          description: "Appointment booking",
          active: true,
          displayOrder: 1,
        },
        {
          name: "Reservation",
          description: "Reservation",
          active: true,
          displayOrder: 2,
        },
        {
          name: "Event Booking",
          description: "Event booking",
          active: true,
          displayOrder: 3,
        },
        {
          name: "Service Booking",
          description: "Service booking",
          active: true,
          displayOrder: 4,
        },
        {
          name: "Tour / Activity",
          description: "Tour / activity",
          active: true,
          displayOrder: 5,
        },
        {
          name: "Rental",
          description: "Rental",
          active: true,
          displayOrder: 6,
        },
        {
          name: "Class / Session",
          description: "Class / session",
          active: true,
          displayOrder: 7,
        },
        {
          name: "Consultation",
          description: "Consultation",
          active: true,
          displayOrder: 8,
        },
        {
          name: "Package Booking",
          description: "Package booking",
          active: true,
          displayOrder: 9,
        },
        {
          name: "Group Booking",
          description: "Group booking",
          active: true,
          displayOrder: 10,
        },
        {
          name: "Membership Booking",
          description: "Membership booking",
          active: true,
          displayOrder: 11,
        },
        {
          name: "Other",
          description: "Other booking type",
          active: true,
          displayOrder: 12,
        },
      ],
      bookingStatuses: [
        { name: "Draft", color: "#94a3b8", active: true, displayOrder: 1 },
        { name: "Pending", color: "#fbbf24", active: true, displayOrder: 2 },
        {
          name: "Awaiting Payment",
          color: "#a78bfa",
          active: true,
          displayOrder: 3,
        },
        { name: "Confirmed", color: "#34d399", active: true, displayOrder: 4 },
        {
          name: "Rescheduled",
          color: "#60a5fa",
          active: true,
          displayOrder: 5,
        },
        { name: "Completed", color: "#22c55e", active: true, displayOrder: 6 },
        { name: "Cancelled", color: "#f87171", active: true, displayOrder: 7 },
        { name: "No Show", color: "#f97316", active: true, displayOrder: 8 },
        { name: "Expired", color: "#64748b", active: true, displayOrder: 9 },
      ],
      confirmationRules: {
        rule: "Confirm after deposit payment",
        expireUnpaidAfterHours: 24,
        autoConfirm: false,
      },
      cancellationRules: {
        allowCustomerCancellation: true,
        cancellationDeadlineDays: 7,
        refundRule: "Full",
        staffApprovalRequired: false,
      },
      reschedulingRules: {
        allowRescheduling: true,
        maxReschedules: 3,
        rescheduleDeadlineDays: 7,
        rescheduleFee: 0,
        requireStaffApproval: false,
      },
    },
    payments: {
      paymentTypes: [
        {
          name: "Free",
          description: "No charge booking",
          active: true,
          displayOrder: 1,
        },
        {
          name: "Pay in Full",
          description: "The full amount is required up front",
          active: true,
          displayOrder: 2,
        },
        {
          name: "Deposit",
          description: "A deposit is required at booking",
          active: true,
          displayOrder: 3,
        },
        {
          name: "Partial Payment",
          description: "Partial amount is allowed",
          active: true,
          displayOrder: 4,
        },
        {
          name: "Pay Later",
          description: "Pay after booking is created",
          active: true,
          displayOrder: 5,
        },
        {
          name: "Pay on Arrival",
          description: "Payment collected at arrival",
          active: true,
          displayOrder: 6,
        },
        {
          name: "Pay on Completion",
          description: "Payment collected after the service",
          active: true,
          displayOrder: 7,
        },
        {
          name: "Installment Plan",
          description: "Installment plan",
          active: true,
          displayOrder: 8,
        },
        {
          name: "Custom Payment Terms",
          description: "Custom rules",
          active: true,
          displayOrder: 9,
        },
      ],
      paymentStatuses: [
        { name: "Unpaid", active: true, displayOrder: 1 },
        { name: "Deposit Due", active: true, displayOrder: 2 },
        { name: "Deposit Paid", active: true, displayOrder: 3 },
        { name: "Partially Paid", active: true, displayOrder: 4 },
        { name: "Paid in Full", active: true, displayOrder: 5 },
        { name: "Payment Due", active: true, displayOrder: 6 },
        { name: "Overdue", active: true, displayOrder: 7 },
        { name: "Payment Failed", active: true, displayOrder: 8 },
        { name: "Refund Pending", active: true, displayOrder: 9 },
        { name: "Partially Refunded", active: true, displayOrder: 10 },
        { name: "Refunded", active: true, displayOrder: 11 },
        { name: "Payment Cancelled", active: true, displayOrder: 12 },
      ],
      depositRules: {
        type: "Percentage",
        percentage: 30,
        fixedAmount: 1000,
        depositDue: "At booking",
        balanceDue: "Before booking",
        refundRule: "Fully refundable",
        refundDeadlineDays: 7,
      },
      paymentDueRules: [
        { name: "At booking", daysBefore: 0, active: true },
        { name: "Within 24 hours", daysBefore: 1, active: true },
        { name: "Within 7 days", daysBefore: 7, active: true },
      ],
      refundRules: [
        { name: "Fully refundable", active: true },
        { name: "Partially refundable", active: true },
        { name: "Non-refundable", active: true },
      ],
    },
    notifications: {
      bookingNotifications: [
        { name: "Booking created", active: true },
        { name: "Booking confirmed", active: true },
        { name: "Booking rescheduled", active: true },
        { name: "Booking cancelled", active: true },
        { name: "Booking completed", active: true },
        { name: "No-show", active: true },
      ],
      paymentNotifications: [
        { name: "Deposit reminder", active: true },
        { name: "Payment received", active: true },
        { name: "Balance due", active: true },
        { name: "Payment overdue", active: true },
        { name: "Payment failed", active: true },
        { name: "Refund processed", active: true },
      ],
      reminders: [
        { name: "Booking reminder", active: true },
        { name: "Payment reminder", active: true },
        { name: "Follow-up after completed booking", active: true },
        { name: "Review request", active: true },
      ],
    },
    automation: {
      autoConfirm: false,
      autoCancel: false,
      paymentOverdue: true,
      noShow: true,
      followUp: true,
    },
  };

  if (business) {
    if (!business.settings) business.settings = defaultSettings;

    const mergedSettings: any = {
      ...defaultSettings,
      ...business.settings,
      ...(input.settings ?? {}),
      booking: {
        ...(defaultSettings.booking ?? {}),
        ...(business.settings?.booking ?? {}),
        ...(input.settings?.booking ?? {}),
        slotsPerHour,
      },
    };

    business.settings = mergedSettings;
    business.openHour = normalizedOpenHour;
    business.closeHour = normalizedCloseHour;
    business.slotsPerHour = slotsPerHour;
    business.slotIntervalMinutes = slotIntervalMinutes;
    business.isOpen24Hours = isOpen24Hours;
    business.courtsCount = input.courtsCount ?? 3;
    business.disabledCourts = disabledCourts;
    Object.assign(business, input, {
      settings: mergedSettings,
      openHour: normalizedOpenHour,
      closeHour: normalizedCloseHour,
      slotsPerHour,
      slotIntervalMinutes,
      isOpen24Hours,
      courtsCount: input.courtsCount ?? 3,
      disabledCourts,
    });
    await business.save();
  } else {
    const normalizedSettings: any = {
      ...defaultSettings,
      ...(input.settings ?? {}),
      booking: {
        ...(defaultSettings.booking ?? {}),
        ...(input.settings?.booking ?? {}),
        slotsPerHour,
      },
    };

    business = await Business.create({
      ...input,
      ownerId: user._id,
      openHour: normalizedOpenHour,
      closeHour: normalizedCloseHour,
      slotsPerHour,
      slotIntervalMinutes,
      isOpen24Hours,
      courtsCount: input.courtsCount ?? 3,
      disabledCourts,
      settings: normalizedSettings,
    });
    user.businessIds = [business._id];
    await user.save();
  }

  return res.json({
    success: true,
    data: { business: businessResponse(business) },
  });
}
