import { Schema, model, type Document, type Types } from "mongoose";

export interface ICustomer extends Document {
  businessId: Types.ObjectId;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    notes: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true },
);

customerSchema.index({ businessId: 1, email: 1 }, { unique: false });
customerSchema.index({ businessId: 1, phone: 1 }, { unique: false });

export const Customer = model<ICustomer>("Customer", customerSchema);
