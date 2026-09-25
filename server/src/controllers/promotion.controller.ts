import type { Response } from "express";
import { z } from "zod";
import { Promotion } from "../models/Promotion.js";
import type { AuthRequest } from "../middleware/auth.js";
import { promotionSchema } from "../validators/promotion.validators.js";

function promotionResponse(promotion: any) {
  const response = promotion.toObject ? promotion.toObject() : promotion;
  return { ...response, id: response._id.toString() };
}

function normalizeDates(payload: z.infer<typeof promotionSchema>) {
  return {
    ...payload,
    startsAt: payload.startsAt ? new Date(payload.startsAt) : undefined,
    endsAt: payload.endsAt ? new Date(payload.endsAt) : undefined,
  };
}

export async function listPromotions(req: AuthRequest, res: Response) {
  if (!req.businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const promotions = await Promotion.find({ businessId: req.businessId }).sort({
    createdAt: -1,
  });
  return res.json({
    success: true,
    data: { promotions: promotions.map(promotionResponse) },
  });
}

export async function createPromotion(req: AuthRequest, res: Response) {
  if (!req.businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  try {
    const payload = promotionSchema.parse(req.body);
    const promotion = await Promotion.create({
      ...normalizeDates(payload),
      businessId: req.businessId,
    });
    return res
      .status(201)
      .json({ success: true, data: { promotion: promotionResponse(promotion) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => issue.message),
      });
    }
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "That promotion code is already in use" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Unable to create promotion" });
  }
}

export async function updatePromotion(req: AuthRequest, res: Response) {
  if (!req.businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  try {
    const payload = promotionSchema.parse(req.body);
    const promotion = await Promotion.findOneAndUpdate(
      { _id: req.params.id, businessId: req.businessId },
      { $set: normalizeDates(payload) },
      { new: true, runValidators: true },
    );

    if (!promotion) {
      return res
        .status(404)
        .json({ success: false, message: "Promotion not found" });
    }
    return res.json({
      success: true,
      data: { promotion: promotionResponse(promotion) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => issue.message),
      });
    }
    if ((error as { code?: number }).code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "That promotion code is already in use" });
    }
    return res
      .status(500)
      .json({ success: false, message: "Unable to update promotion" });
  }
}

export async function deletePromotion(req: AuthRequest, res: Response) {
  if (!req.businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const promotion = await Promotion.findOneAndDelete({
    _id: req.params.id,
    businessId: req.businessId,
  });
  if (!promotion) {
    return res
      .status(404)
      .json({ success: false, message: "Promotion not found" });
  }

  return res.json({
    success: true,
    data: { promotion: promotionResponse(promotion) },
  });
}
