import type { Response } from "express";
import { z } from "zod";
import { Service } from "../models/Service.js";
import type { AuthRequest } from "../middleware/auth.js";
import { serviceSchema } from "../validators/service.validators.js";

export async function listServices(req: AuthRequest, res: Response) {
  const businessId = req.businessId;

  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const services = await Service.find({ businessId }).sort({ createdAt: -1 });
  return res.json({ success: true, data: { services } });
}

export async function createService(req: AuthRequest, res: Response) {
  const businessId = req.businessId;

  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  try {
    const payload = serviceSchema.parse(req.body);
    const service = await Service.create({
      ...payload,
      businessId,
    });

    return res.status(201).json({ success: true, data: { service } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Validation failed",
          errors: error.issues.map((issue) => issue.message),
        });
    }

    return res
      .status(500)
      .json({ success: false, message: "Unable to create service" });
  }
}
