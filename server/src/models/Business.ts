import { Schema, model, type Document, type Types } from "mongoose";

export interface IBusiness extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  description?: string;
  openHour: string;
  closeHour: string;
  slotsPerHour?: number;
  slotIntervalMinutes?: number;
  isOpen24Hours?: boolean;
  courtsCount?: number;
  disabledCourts?: string[];
  isActive: boolean;
  settings?: {
    booking: {
      slotsPerHour?: number;
      slotIntervalMinutes?: number;
      isOpen24Hours?: boolean;
      courtsCount?: number;
      bookingTypes: Array<{
        name: string;
        description?: string;
        active: boolean;
        displayOrder: number;
      }>;
      bookingStatuses: Array<{
        name: string;
        color?: string;
        active: boolean;
        displayOrder: number;
      }>;
      confirmationRules: {
        rule: string;
        expireUnpaidAfterHours?: number;
        autoConfirm: boolean;
      };
      cancellationRules: {
        allowCustomerCancellation: boolean;
        cancellationDeadlineDays?: number;
        refundRule: string;
        staffApprovalRequired: boolean;
      };
      reschedulingRules: {
        allowRescheduling: boolean;
        maxReschedules?: number;
        rescheduleDeadlineDays?: number;
        rescheduleFee?: number;
        requireStaffApproval: boolean;
      };
    };
    payments: {
      paymongo?: {
        secretKey?: string;
      };
      paymentTypes: Array<{
        name: string;
        description?: string;
        active: boolean;
        displayOrder: number;
      }>;
      paymentStatuses: Array<{
        name: string;
        active: boolean;
        displayOrder: number;
      }>;
      depositRules: {
        type: string;
        percentage?: number;
        fixedAmount?: number;
        depositDue: string;
        balanceDue: string;
        refundRule: string;
        refundDeadlineDays?: number;
      };
      paymentDueRules: Array<{
        name: string;
        daysBefore: number;
        active: boolean;
      }>;
      refundRules: Array<{ name: string; active: boolean }>;
    };
    notifications: {
      bookingNotifications: Array<{ name: string; active: boolean }>;
      paymentNotifications: Array<{ name: string; active: boolean }>;
      reminders: Array<{ name: string; active: boolean }>;
    };
    automation: {
      autoConfirm: boolean;
      autoCancel: boolean;
      paymentOverdue: boolean;
      noShow: boolean;
      followUp: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const defaultSettings = {
  booking: {
    slotsPerHour: 2,
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
      { name: "Rental", description: "Rental", active: true, displayOrder: 6 },
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
      { name: "Rescheduled", color: "#60a5fa", active: true, displayOrder: 5 },
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

const businessSchema = new Schema<IBusiness>(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, default: "" },
    openHour: { type: String, default: "08:00" },
    closeHour: { type: String, default: "20:00" },
    slotsPerHour: { type: Number, default: 2, min: 1, max: 12 },
    slotIntervalMinutes: { type: Number, default: 30, min: 15, max: 180 },
    isOpen24Hours: { type: Boolean, default: false },
    courtsCount: { type: Number, default: 3, min: 1 },
    disabledCourts: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    settings: {
      type: Object,
      default: defaultSettings,
    },
  },
  { timestamps: true },
);

export const Business = model<IBusiness>("Business", businessSchema);
