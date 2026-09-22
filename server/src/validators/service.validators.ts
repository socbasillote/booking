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
  isActive: z.boolean().default(true),
  onlineBookingEnabled: z.boolean().default(true),
  assignedStaffIds: z.array(z.string()).default([]),
});
