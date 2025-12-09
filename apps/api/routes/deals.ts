import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@db/client";
import { authenticate } from "../middleware/auth";
import { addDealSchema, updateDealSchema, softDeleteDealSchema } from "@repo/zod";

const router = Router();

// GET /deals - List all deals (role-based access)
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;
    const { includeDeleted } = req.query;

    // Build where clause based on role
    // Admin sees all, Manager sees their own + employees', Employee sees only their own
    let where: any = {};

    if (role === "EMPLOYEE") {
      where.ownerId = userId;
    } else if (role === "MANAGER") {
      // Manager sees their deals + their team's deals (employees they manage)
      // For now, manager sees deals they own. In future, add team hierarchy
      where.ownerId = userId;
    }
    // Admin sees all deals (no filter)

    // Exclude soft-deleted deals by default
    if (includeDeleted !== "true" || role === "EMPLOYEE") {
      where.isDeleted = false;
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            primaryContact: true,
            accountManagerId: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        deletedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    // Group deals by stage for kanban view
    const dealsByStage = {
      QUALIFICATION: [] as any[],
      NEEDS_ANALYSIS: [] as any[],
      VALUE_PROPOSITION: [] as any[],
      PROPOSAL_PRICE_QUOTE: [] as any[],
      NEGOTIATION: [] as any[],
      CLOSED_WON: [] as any[],
      CLOSED_LOST: [] as any[],
    };

    let totalValue = 0;
    const stageValues = {
      QUALIFICATION: 0,
      NEEDS_ANALYSIS: 0,
      VALUE_PROPOSITION: 0,
      PROPOSAL_PRICE_QUOTE: 0,
      NEGOTIATION: 0,
      CLOSED_WON: 0,
      CLOSED_LOST: 0,
    };

    deals.forEach((deal) => {
      dealsByStage[deal.stage].push(deal);
      const dealValue = Number(deal.value);
      stageValues[deal.stage] += dealValue;
      
      // Only count active deals (not closed) in total value
      if (!["CLOSED_WON", "CLOSED_LOST"].includes(deal.stage) && !deal.isDeleted) {
        totalValue += dealValue;
      }
    });

    res.json({
      deals,
      dealsByStage,
      stageValues,
      totalValue,
      total: deals.length,
    });
  } catch (error) {
    console.error("List deals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /deals/archived - List soft-deleted deals (admin/manager only)
router.get("/archived", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === "EMPLOYEE") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Build where clause
    let where: any = { isDeleted: true };

    if (role === "MANAGER") {
      where.ownerId = userId;
    }

    const deals = await prisma.deal.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            primaryContact: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        deletedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    res.json({
      deals,
      total: deals.length,
    });
  } catch (error) {
    console.error("List archived deals error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /deals/:id - Get single deal
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            primaryContact: true,
            email: true,
            mobile: true,
            accountManagerId: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        deletedBy: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    // Check access rights
    if (role === "EMPLOYEE" && deal.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ deal });
  } catch (error) {
    console.error("Get deal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /deals/:id - Update deal (including stage changes)
router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = updateDealSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
      include: { client: true },
    });

    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    // Check access rights
    if (role === "EMPLOYEE" && deal.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const oldStage = deal.stage;
    const newStage = data.stage || oldStage;

    // Update the deal
    const updatedDeal = await prisma.deal.update({
      where: { id },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
        actualCloseDate: 
          newStage === "CLOSED_WON" || newStage === "CLOSED_LOST" 
            ? new Date() 
            : undefined,
      },
      include: {
        client: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    // Update client lifetime value if deal is won
    if (oldStage !== "CLOSED_WON" && newStage === "CLOSED_WON") {
      await prisma.client.update({
        where: { id: deal.clientId },
        data: {
          lifetimeValue: {
            increment: data.value || deal.value,
          },
        },
      });
    } else if (oldStage === "CLOSED_WON" && newStage !== "CLOSED_WON") {
      // If moving deal back from CLOSED_WON, subtract from lifetime value
      await prisma.client.update({
        where: { id: deal.clientId },
        data: {
          lifetimeValue: {
            decrement: deal.value,
          },
        },
      });
    }

    res.json({
      message: "Deal updated successfully",
      deal: updatedDeal,
    });
  } catch (error) {
    console.error("Update deal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /deals/:id - Soft delete deal (only if closed)
router.delete("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    // Check access rights
    if (role === "EMPLOYEE" && deal.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Only allow deletion if deal is closed
    if (deal.stage !== "CLOSED_WON" && deal.stage !== "CLOSED_LOST") {
      res.status(400).json({ 
        error: "Can only delete deals that are closed (won or lost)" 
      });
      return;
    }

    // Soft delete the deal
    const deletedDeal = await prisma.deal.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    res.json({
      message: "Deal archived successfully",
      deal: deletedDeal,
    });
  } catch (error) {
    console.error("Delete deal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /deals/:id/restore - Restore soft-deleted deal (admin/manager only)
router.post("/:id/restore", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    if (role === "EMPLOYEE") {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    if (!deal.isDeleted) {
      res.status(400).json({ error: "Deal is not deleted" });
      return;
    }

    // Check access for manager
    if (role === "MANAGER" && deal.ownerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // Restore the deal
    const restoredDeal = await prisma.deal.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
      },
      include: {
        client: true,
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
      message: "Deal restored successfully",
      deal: restoredDeal,
    });
  } catch (error) {
    console.error("Restore deal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

