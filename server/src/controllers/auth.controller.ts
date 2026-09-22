import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginSchema, registerSchema } from "../validators/auth.validators.js";
import { loginUser, registerUser } from "../services/auth.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { User } from "../models/User.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function registerController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = registerSchema.parse(req.body);
    const data = await registerUser(payload);
    return sendSuccess(res, data, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(
        res,
        "Validation failed",
        400,
        error.issues.map((issue) => issue.message),
      );
    }

    if (error instanceof Error) {
      return sendError(res, error.message, 400);
    }

    return next(error);
  }
}

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const payload = loginSchema.parse(req.body);
    const data = await loginUser(payload);
    return sendSuccess(res, data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return sendError(
        res,
        "Validation failed",
        400,
        error.issues.map((issue) => issue.message),
      );
    }

    if (error instanceof Error) {
      return sendError(res, error.message, 401);
    }

    return next(error);
  }
}

export async function meController(req: AuthRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return sendError(res, "User not found", 404);
  return sendSuccess(res, {
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  });
}
