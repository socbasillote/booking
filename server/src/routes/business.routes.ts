import { Router } from "express";
import {
  getBusiness,
  saveBusiness,
} from "../controllers/business.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const businessRouter = Router();
businessRouter.use(requireAuth);
businessRouter.get("/", requireRole("owner", "admin"), getBusiness);
businessRouter.put("/", requireRole("owner", "admin"), saveBusiness);
