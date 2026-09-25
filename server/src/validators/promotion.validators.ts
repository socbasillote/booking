import { z } from "zod";

const promotionFields = z.object({
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
