import { Router } from "express";
import { createTeamMember, listTeam } from "../controllers/team.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const teamRouter = Router();
teamRouter.use(requireAuth);
teamRouter.get("/", requireRole("owner", "admin"), listTeam);
teamRouter.post("/", requireRole("owner", "admin"), createTeamMember);
