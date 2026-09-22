import { Schema, model, type Document, type Types } from "mongoose";

export type UserRole = "owner" | "admin" | "staff";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  businessIds: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["owner", "admin", "staff"],
      default: "staff",
    },
    businessIds: [{ type: Schema.Types.ObjectId, ref: "Business" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export const User = model<IUser>("User", userSchema);
