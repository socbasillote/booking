import type { Response } from "express";
import { z } from "zod";
import { Service } from "../models/Service.js";
import { Business } from "../models/Business.js";
import type { AuthRequest } from "../middleware/auth.js";
import { serviceSchema } from "../validators/service.validators.js";

const defaultPickleballService = {
  name: "Pickleball",
  description: "Pickleball court booking",
  price: 99,
  durationMinutes: 60,
  bufferMinutes: 0,
  category: "Sports",
  isActive: true,
  onlineBookingEnabled: true,
  assignedStaffIds: [],
};

function serviceResponse(service: any) {
  const response = service.toObject ? service.toObject() : service;
  return { ...response, id: response._id.toString() };
}

export async function listServices(req: AuthRequest, res: Response) {
  const businessId = req.businessId;

  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const services = await Service.find({ businessId }).sort({ createdAt: -1 });
  const business = await Business.findById(businessId).select("currency");
  return res.json({
    success: true,
    data: {
      services: services.map(serviceResponse),
      currency: business?.currency ?? "PHP",
    },
  });
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

    return res
      .status(201)
      .json({ success: true, data: { service: serviceResponse(service) } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
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

export async function updateService(req: AuthRequest, res: Response) {
  const businessId = req.businessId;

  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  try {
    const payload = serviceSchema.partial().parse(req.body);
    const service = await Service.findOneAndUpdate(
      { _id: req.params.id, businessId },
      { $set: payload },
      { new: true, runValidators: true },
    );

    if (!service) {
      return res
        .status(404)
        .json({ success: false, message: "Service not found" });
    }

    return res.json({
      success: true,
      data: { service: serviceResponse(service) },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => issue.message),
      });
    }

    return res
      .status(500)
      .json({ success: false, message: "Unable to update service" });
  }
}

export async function deleteService(req: AuthRequest, res: Response) {
  const businessId = req.businessId;

  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const service = await Service.findOneAndDelete({
    _id: req.params.id,
    businessId,
  });

  if (!service) {
    return res
      .status(404)
      .json({ success: false, message: "Service not found" });
  }

  return res.json({
    success: true,
    data: { service: serviceResponse(service) },
  });
}
