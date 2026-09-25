import { Schema, model, type Document, type Types } from "mongoose";

export type PromotionStatus = "Draft" | "Scheduled" | "Live" | "Expired";
export type PromotionDiscountType = "percentage" | "fixed";

export interface IPromotion extends Document {
  businessId: Types.ObjectId;
  title: string;
  description: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  status: PromotionStatus;
  startsAt?: Date;
  endsAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const promotionSchema = new Schema<IPromotion>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Draft", "Scheduled", "Live", "Expired"],
      default: "Draft",
    },
    startsAt: Date,
    endsAt: Date,
  },
  { timestamps: true },
);

promotionSchema.index({ businessId: 1, createdAt: -1 });

export const Promotion = model<IPromotion>("Promotion", promotionSchema);
