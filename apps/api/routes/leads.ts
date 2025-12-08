import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@db/client";
import { authenticate } from "../middleware/auth";
import { createLeadSchema, updateLeadSchema, convertLeadSchema } from "@repo/zod";

const router = Router();

// GET /leads - List all leads for current user (or all for admin/manager)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Build where clause based on role
    // Admin sees all, Manager sees all, Employee sees only their own
    const where = role === "EMPLOYEE" ? { ownerId: userId, isConverted: false } : { isConverted: false };

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

    // Get counts by pipeline stage
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
    const baseWhere = role === "EMPLOYEE" ? { ownerId: userId } : {};
    const activeWhere = { ...baseWhere, isConverted: false };

    const [total, converted, byStatus, bySource, byPriority, byStage] = await Promise.all([
      prisma.lead.count({ where: activeWhere }),
      prisma.lead.count({ where: { ...baseWhere, isConverted: true } }),
      prisma.lead.groupBy({
        by: ["status"],
        where: activeWhere,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["source"],
        where: activeWhere,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["priority"],
        where: activeWhere,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ["pipelineStage"],
        where: activeWhere,
        _count: true,
      }),
    ]);

    res.json({
      total,
      converted,
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      bySource: bySource.reduce((acc, item) => ({ ...acc, [item.source]: item._count }), {}),
      byPriority: byPriority.reduce((acc, item) => ({ ...acc, [item.priority]: item._count }), {}),
      byStage: byStage.reduce((acc, item) => ({ ...acc, [item.pipelineStage]: item._count }), {}),
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
    const { userId, role } = req.user!;

    // Determine the owner ID
    let ownerId = userId;
    if (data.ownerId) {
      // Only admin/manager can assign leads to others
      if (role === "EMPLOYEE") {
        res.status(403).json({ error: "Employees cannot assign leads to others" });
        return;
      }
      // Manager can only assign to themselves or employees
      if (role === "MANAGER") {
        const assignee = await prisma.user.findUnique({ where: { id: data.ownerId } });
        if (!assignee || (assignee.id !== userId && assignee.role !== "EMPLOYEE")) {
          res.status(403).json({ error: "Cannot assign to this user" });
          return;
        }
      }
      ownerId = data.ownerId;
    }

    const lead = await prisma.lead.create({
      data: {
        name: data.name,
        companyName: data.companyName || null,
        email: data.email || null,
        mobile: data.mobile || null,
        source: data.source,
        sourceDetails: data.sourceDetails || null,
        pipelineStage: data.pipelineStage || "NEW",
        status: data.status || "NEW",
        priority: data.priority,
        initialNotes: data.initialNotes || null,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        tags: data.tags || [],
        ownerId,
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
        ...(data.initialNotes !== undefined && { initialNotes: data.initialNotes }),
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

// POST /leads/:id/convert - Convert lead to client
router.post("/:id/convert", authenticate, async (req: Request, res: Response) => {
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

    // Check access
    if (role === "EMPLOYEE" && lead.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    if (lead.isConverted) {
      res.status(400).json({ error: "Lead is already converted" });
      return;
    }

    const validation = convertLeadSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { estimatedValue } = validation.data;

    // Create client and update lead in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create client from lead
      const client = await tx.client.create({
        data: {
          companyName: lead.companyName || lead.name,
          primaryContact: lead.name,
          email: lead.email,
          mobile: lead.mobile,
          status: "ACTIVE",
          lifetimeValue: estimatedValue,
          accountManagerId: lead.ownerId,
        },
      });

      // Update lead as converted
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          isConverted: true,
          convertedAt: new Date(),
          convertedClientId: client.id,
          status: "CONVERTED",
          estimatedValue: estimatedValue,
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

      return { lead: updatedLead, client };
    });

    res.json({
      message: "Lead converted to client successfully",
      lead: result.lead,
      client: result.client,
    });
  } catch (error) {
    console.error("Convert lead error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
