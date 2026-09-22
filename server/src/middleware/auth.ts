import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";

export type AuthRequest = Request & {
  userId?: string;
  userRole?: string;
  businessId?: string;
};

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not have access to this resource",
        });
    }
    next();
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      sub: string;
      role: string;
    };
    req.userId = payload.sub;
    req.userRole = payload.role;

    const user = await User.findById(payload.sub);

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "User account is not active" });
    }

    const businessId = user.businessIds?.[0]?.toString();

    if (businessId) {
      const business = await Business.findById(businessId);
      if (!business || !business.isActive) {
        return res.status(403).json({
          success: false,
          message: "Business access is not available",
        });
      }
      req.businessId = businessId;
    }

    next();
  } catch {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired session" });
  }
}
