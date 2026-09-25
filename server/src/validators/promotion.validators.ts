import { z } from "zod";

const promotionFields = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Promotion code must be at least 3 characters")
    .max(30, "Promotion code cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Promotion code can only use letters, numbers, _ or -")
    .transform((value) => value.toUpperCase()),
  title: z.string().trim().min(2, "Promotion title is required"),
  description: z.string().trim().min(2, "Promotion description is required"),
  discountType: z.enum(["percentage", "fixed"]),
  discountValue: z.coerce.number().positive("Discount must be greater than 0"),
  status: z.enum(["Draft", "Scheduled", "Live", "Expired"]),
  startsAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  endsAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export const promotionSchema = promotionFields.superRefine((value, context) => {
  if (value.discountType === "percentage" && value.discountValue > 100) {
    context.addIssue({
      code: "custom",
      path: ["discountValue"],
      message: "Percentage discount cannot exceed 100",
    });
  }

  if (value.startsAt && value.endsAt && value.startsAt > value.endsAt) {
    context.addIssue({
      code: "custom",
      path: ["endsAt"],
      message: "End date must be after the start date",
    });
  }
});
