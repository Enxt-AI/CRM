import { Router } from "express";
import type { Request, Response } from "express";
import prisma from "@db/client";
import { authenticate } from "../middleware/auth";
import {
  updateClientSchema,
  addDocumentSchema,
  addTaskSchema,
  addMeetingSchema,
  addNoteSchema,
  addDealSchema,
  updateDealSchema,
} from "@repo/zod";

const router = Router();

// GET /clients - List all clients
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const { role, userId } = req.user!;

    // Role-based filtering: Admin/Manager see all, Employee sees only their clients
    const where = role === "EMPLOYEE" ? { accountManagerId: userId } : {};

    const clients = await prisma.client.findMany({
      where,
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        deals: {
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            currency: true,
          },
        },
        _count: {
          select: {
            deals: true,
            documents: true,
            tasks: true,
            meetings: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate total deals value for each client
    const clientsWithStats = clients.map((client) => ({
      ...client,
      totalDealsValue: client.deals.reduce((sum, deal) => sum + Number(deal.value), 0),
      activeDealsCount: client.deals.filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST").length,
    }));

    res.json({
      clients: clientsWithStats,
      total: clients.length,
    });
  } catch (error) {
    console.error("List clients error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /clients/:id - Get single client with full details
router.get("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
        originLead: {
          select: {
            id: true,
            name: true,
            source: true,
            convertedAt: true,
          },
        },
        deals: {
          where: {
            isDeleted: false, // Only show active deals
          },
          orderBy: { createdAt: "desc" },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { dueDate: "asc" },
        },
        meetings: {
          include: {
            organizer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { startTime: "desc" },
        },
        notes: {
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        },
        activities: {
          include: {
            createdBy: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { occurredAt: "desc" },
          take: 50,
        },
      },
    });

    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    // Check access for employees
    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    res.json({ client });
  } catch (error) {
    console.error("Get client error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /clients/:id - Update client
router.patch("/:id", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = updateClientSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // Check if client exists and user has access
    const existingClient = await prisma.client.findUnique({ where: { id } });
    if (!existingClient) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && existingClient.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        lifetimeValue: data.lifetimeValue !== undefined ? data.lifetimeValue : undefined,
      },
      include: {
        accountManager: {
          select: {
            id: true,
            fullName: true,
            username: true,
          },
        },
      },
    });

    res.json({
      message: "Client updated successfully",
      client,
    });
  } catch (error) {
    console.error("Update client error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /clients/:id/documents - Add document (link or file)
router.post("/:id/documents", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = addDocumentSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    // Check access
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;

    // For now, handle links. File upload will use separate endpoint with S3
    if (!data.isLink) {
      res.status(400).json({ error: "File upload not yet implemented. Use isLink: true for now." });
      return;
    }

    const document = await prisma.document.create({
      data: {
        name: data.name,
        url: data.url || "",
        fileType: "link",
        isLink: true,
        category: data.category || null,
        clientId: id,
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: "DOCUMENT_UPLOAD",
        title: `Document added: ${data.name}`,
        createdById: userId,
        clientId: id,
      },
    });

    res.status(201).json({
      message: "Document added successfully",
      document,
    });
  } catch (error) {
    console.error("Add document error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /clients/:id/tasks - Add task
router.post("/:id/tasks", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = addTaskSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        type: data.type,
        dueDate: new Date(data.dueDate),
        assignedToId: data.assignedToId || userId,
        clientId: id,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error("Add task error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /clients/:id/meetings - Add meeting
router.post("/:id/meetings", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = addMeetingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const meeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        meetingUrl: data.meetingUrl || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        organizerId: userId,
        clientId: id,
      },
      include: {
        organizer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Meeting scheduled successfully",
      meeting,
    });
  } catch (error) {
    console.error("Add meeting error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /clients/:id/notes - Add note
router.post("/:id/notes", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    const validation = addNoteSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const note = await prisma.note.create({
      data: {
        content: data.content,
        isPinned: data.isPinned,
        authorId: userId,
        clientId: id,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Note added successfully",
      note,
    });
  } catch (error) {
    console.error("Add note error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /clients/:id/deals - Add deal (revenue)
router.post("/:id/deals", authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user!;

    if (!id) {
      res.status(400).json({ error: "Client ID is required" });
      return;
    }

    const validation = addDealSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: "Validation failed",
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      res.status(404).json({ error: "Client not found" });
      return;
    }

    if (role === "EMPLOYEE" && client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const deal = await prisma.deal.create({
      data: {
        title: data.title,
        description: data.description || null,
        value: data.value,
        budget: data.budget !== undefined ? data.budget : null,
        currency: data.currency || "INR",
        dealType: data.dealType || null,
        industry: data.industry || client.industry || null,
        stage: data.stage || "QUALIFICATION",
        probability: data.probability || 50,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
        nextSteps: data.nextSteps || null,
        ownerId: data.ownerId || client.accountManagerId,
        clientId: id,
      },
    });

    // Update client lifetime value if deal is won
    if (data.stage === "CLOSED_WON") {
      await prisma.client.update({
        where: { id },
        data: {
          lifetimeValue: {
            increment: data.value,
          },
        },
      });
    }

    // Create activity
    await prisma.activity.create({
      data: {
        type: "DEAL_CREATED",
        title: `Deal created: ${data.title}`,
        description: `Value: ${data.currency} ${data.value}`,
        createdById: userId,
        clientId: id,
      },
    });

    res.status(201).json({
      message: "Deal created successfully",
      deal,
    });
  } catch (error) {
    console.error("Add deal error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /clients/:clientId/deals/:dealId - Update deal
router.patch("/:clientId/deals/:dealId", authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, dealId } = req.params;
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
      where: { id: dealId },
      include: { client: true },
    });

    if (!deal || deal.clientId !== clientId) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    if (role === "EMPLOYEE" && deal.client.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    const data = validation.data;
    const oldStage = deal.stage;
    const newStage = data.stage || oldStage;

    const updatedDeal = await prisma.deal.update({
      where: { id: dealId },
      data: {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
      },
    });

    // Update client lifetime value if stage changed to CLOSED_WON
    if (oldStage !== "CLOSED_WON" && newStage === "CLOSED_WON") {
      await prisma.client.update({
        where: { id: clientId },
        data: {
          lifetimeValue: {
            increment: data.value || deal.value,
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

// DELETE /clients/:clientId/documents/:documentId - Delete document
router.delete("/:clientId/documents/:documentId", authenticate, async (req: Request, res: Response) => {
  try {
    const { clientId, documentId } = req.params;
    const { role, userId } = req.user!;

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { client: true },
    });

    if (!document || document.clientId !== clientId) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    if (role === "EMPLOYEE" && document.client!.accountManagerId !== userId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    // TODO: If S3 file, delete from S3 first

    await prisma.document.delete({ where: { id: documentId } });

    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
