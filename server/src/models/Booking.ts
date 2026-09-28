import { Schema, model, type Document, type Types } from "mongoose";

export interface IBooking extends Document {
  businessId: Types.ObjectId;
  customer: string;
  email: string;
  phone?: string;
  service: string;
  amount: number;
  promotionId?: Types.ObjectId;
  promotionCode?: string;
  promotionTitle?: string;
  discountAmount?: number;
  staff: string;
  court: string;
  date: string;
  time: string;
  payment: "Unpaid" | "Deposit" | "Paid";
  amountPaid: number;
  amountRefunded: number;
  transactions: Array<{
    type: "Charge" | "Refund";
    amount: number;
    method: string;
    reference: string;
    createdAt: Date;
  }>;
  paymentMethod:
    | "Cash"
    | "Card"
    | "GCash"
    | "Bank transfer"
    | "PayPal"
    | "PayMongo";
  status: "Pending" | "Confirmed" | "Completed" | "Rejected";
  confirmationCode: string;
  paymongoCheckoutSessionId?: string;
  confirmationEmailSentAt?: Date;
  archivedAt?: Date;
  createdAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    customer: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    service: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0, default: 0 },
    promotionId: { type: Schema.Types.ObjectId, ref: "Promotion" },
    promotionCode: { type: String, trim: true, uppercase: true },
    promotionTitle: { type: String, trim: true },
    discountAmount: { type: Number, min: 0, default: 0 },
    staff: { type: String, required: true, default: "Maria", trim: true },
    court: { type: String, required: true, default: "Court 1", trim: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    payment: {
      type: String,
      enum: ["Unpaid", "Deposit", "Paid"],
      default: "Unpaid",
    },
    amountPaid: { type: Number, min: 0, default: 0 },
    amountRefunded: { type: Number, min: 0, default: 0 },
    transactions: [
      {
        type: { type: String, enum: ["Charge", "Refund"], required: true },
        amount: { type: Number, min: 0, required: true },
        method: { type: String, required: true },
        reference: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "GCash", "Bank transfer", "PayPal", "PayMongo"],
      required: true,
    },
    paymongoCheckoutSessionId: { type: String, index: true },
    confirmationEmailSentAt: { type: Date },
    archivedAt: { type: Date, default: null },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Completed", "Rejected"],
      default: "Pending",
    },
    confirmationCode: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const Booking = model<IBooking>("Booking", bookingSchema);
