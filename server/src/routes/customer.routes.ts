import { Router } from "express";
import { listCustomers } from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const customerRouter = Router();
customerRouter.use(requireAuth);
customerRouter.get("/", listCustomers);
