import { Schema, model, type Document, type Types } from "mongoose";

export interface IService extends Document {
  businessId: Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  durationMinutes: number;
  bufferMinutes: number;
  category: string;
  isActive: boolean;
  onlineBookingEnabled: boolean;
  assignedStaffIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<IService>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 15 },
    bufferMinutes: { type: Number, default: 0, min: 0 },
    category: { type: String, default: "General" },
    isActive: { type: Boolean, default: true },
    onlineBookingEnabled: { type: Boolean, default: true },
    assignedStaffIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

serviceSchema.index({ businessId: 1, name: 1 }, { unique: true });

export const Service = model<IService>("Service", serviceSchema);
