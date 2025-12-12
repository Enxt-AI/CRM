import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@db/client";
import { authenticate } from "../middleware/auth";

const router = Router();

// GET /meetings - List all meetings for current user
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;
    
    // Role-based filtering:
    // EMPLOYEE: See only meetings they organized
    // MANAGER/ADMIN: See all meetings
    const where = role === "EMPLOYEE" ? { organizerId: userId } : {};
    
    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
          },
        },
        client: {
          select: {
            id: true,
            companyName: true,
          },
        },
        lead: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });
    
    res.json({ meetings });
  } catch (error) {
    console.error("Get meetings error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /meetings/:id - Delete a meeting
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;
    
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }
    
    // Only organizer or admin/manager can delete
    if (role === "EMPLOYEE" && meeting.organizerId !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    await prisma.meeting.delete({ where: { id } });
    
    res.json({ message: "Meeting deleted successfully" });
  } catch (error) {
    console.error("Delete meeting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
