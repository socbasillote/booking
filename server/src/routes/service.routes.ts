import { Router } from "express";
import {
  createService,
  listServices,
} from "../controllers/service.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const serviceRouter = Router();

serviceRouter.use(requireAuth);
serviceRouter.get("/", listServices);
serviceRouter.post("/", createService);
