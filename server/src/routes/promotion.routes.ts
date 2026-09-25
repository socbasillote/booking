import { Router } from "express";
import {
  createPromotion,
  deletePromotion,
  listPromotions,
  updatePromotion,
} from "../controllers/promotion.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const promotionRouter = Router();

promotionRouter.use(requireAuth);
promotionRouter.get("/", listPromotions);
promotionRouter.post("/", createPromotion);
promotionRouter.put("/:id", updatePromotion);
promotionRouter.delete("/:id", deletePromotion);
