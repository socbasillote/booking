import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Service name is required"),
  description: z.string().trim().max(500).default(""),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15, "Duration must be at least 15 minutes"),
  bufferMinutes: z.coerce.number().int().min(0).default(0),
  category: z.string().trim().min(1).default("General"),
  icon: z
    .enum(["court", "trophy", "fitness", "target", "water", "energy"])
    .default("court"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value")
    .default("#059669"),
  isActive: z.boolean().default(true),
  onlineBookingEnabled: z.boolean().default(true),
  assignedStaffIds: z.array(z.string()).default([]),
});
