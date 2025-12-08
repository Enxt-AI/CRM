import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@db/client";
import { authenticate } from "../middleware/auth";
import { createLeadSchema, updateLeadSchema } from "@repo/zod";

const router = Router();

// GET /leads - List all leads for current user (or all for admin/manager)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Build where clause based on role
    const where = role === "EMPLOYEE" ? { ownerId: userId } : {};

    const leads = await prisma.lead.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get counts by status
    const counts = await prisma.lead.groupBy({
      by: ["pipelineStage"],
      where,
      _count: true,
    });

    const countByStage = counts.reduce(
      (acc, item) => {
        acc[item.pipelineStage] = item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    res.json({
      leads,
      total: leads.length,
      countByStage,
    });
  } catch (error) {
    console.error("List leads error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leads/stats - Get lead statistics
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;
    const where = role === "EMPLOYEE" ? { ownerId: userId } : {};

    const [total, byStatus, bySource, byPriority] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["priority"],
        where,
        _count: true,
      }),
    ]);

    res.json({
      total,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      bySource: bySource.reduce((acc, item) => ({ ...acc, [item.source]: item._count }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
    });
  } catch (error) {
    console.error("Get lead stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /leads/:id - Get single lead
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Check access for employees
    if (role === "EMPLOYEE" && lead.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ lead });
  } catch (error) {
    console.error("Get lead error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /leads - Create new lead
router.post("/", authenticate, async (req: Request, res: Response) => {
  try {
    const validation = createLeadSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;
    const { userId } = req.user!;

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        companyName: data.companyName || null,
        email: data.email || null,
        mobile: data.mobile || null,
        source: data.source,
        sourceDetails: data.sourceDetails || null,
        priority: data.priority,
        tags: data.tags || [],
        ownerId: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Lead created successfully",
      lead,
    });
  } catch (error) {
    console.error("Create lead error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /leads/:id - Update lead
router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    // Check if lead exists and user has access
    const existingLead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!existingLead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    if (role === "EMPLOYEE" && existingLead.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const validation = updateLeadSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const data = validation.data;

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.mobile !== undefined && { mobile: data.mobile }),
        ...(data.source && { source: data.source }),
        ...(data.sourceDetails !== undefined && { sourceDetails: data.sourceDetails }),
        ...(data.pipelineStage && { pipelineStage: data.pipelineStage }),
        ...(data.status && { status: data.status }),
        ...(data.priority && { priority: data.priority }),
        ...(data.score !== undefined && { score: data.score }),
        ...(data.tags && { tags: data.tags }),
        ...(data.nextFollowUpAt !== undefined && {
          nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        }),
        lastContactedAt: new Date(),
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    res.json({
      message: "Lead updated successfully",
      lead,
    });
  } catch (error) {
    console.error("Update lead error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /leads/:id - Delete lead
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }

    // Only admin can delete, or owner if they're manager+
    if (role === "EMPLOYEE") {
      res.status(403).json({ error: "Only admins and managers can delete leads" });
      return;
    }

    await prisma.lead.delete({
      where: { id },
    });

    res.json({ message: "Lead deleted successfully" });
  } catch (error) {
    console.error("Delete lead error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
