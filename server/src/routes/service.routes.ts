import { Router } from "express";
import {
  createService,
  deleteService,
  listServices,
  updateService,
} from "../controllers/service.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const serviceRouter = Router();

serviceRouter.use(requireAuth);
serviceRouter.get("/", listServices);
serviceRouter.post("/", createService);
serviceRouter.put("/:id", updateService);
serviceRouter.delete("/:id", deleteService);
