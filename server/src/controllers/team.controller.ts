import type { Response } from "express";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";
import { z } from "zod";
import { createStaffUser } from "../services/auth.service.js";

const staffSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

export async function listTeam(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  const users = await User.find({ businessIds: businessId }).sort({
    role: 1,
    name: 1,
  });
  return res.json({
    success: true,
    data: {
      users: users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      })),
    },
  });
}

export async function createTeamMember(req: AuthRequest, res: Response) {
  const businessId = req.businessId;
  if (!businessId) {
    return res
      .status(400)
      .json({ success: false, message: "Business context is required" });
  }

  try {
    const input = staffSchema.parse(req.body);
    const user = await createStaffUser({ ...input, businessId });
    return res.status(201).json({ success: true, data: { user } });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create staff account",
    });
  }
}
