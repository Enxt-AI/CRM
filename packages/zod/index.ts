import { z } from "zod";

// ================================
// AUTH SCHEMAS
// ================================

// Setup - First admin creation
export const setupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
});

// Sign in
export const signinSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Change password
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

// Create user (Admin only)
export const createUserSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must be at most 50 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be at most 100 characters"),
  role: z.enum(["MANAGER", "EMPLOYEE"], {
    errorMap: () => ({ message: "Role must be either MANAGER or EMPLOYEE" }),
  }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

// ================================
// LEAD SCHEMAS
// ================================

export const leadSourceEnum = z.enum([
  "WEBSITE",
  "LINKEDIN",
  "REFERRAL",
  "COLD_CALL",
  "TRADE_SHOW",
  "PARTNER",
  "EMAIL_CAMPAIGN",
  "OTHER",
]);

export const leadStatusEnum = z.enum([
  "NEW",
  "ATTEMPTING_CONTACT",
  "CONTACTED",
  "QUALIFIED",
  "NURTURING",
  "DISQUALIFIED",
  "CONVERTED",
]);

export const leadPipelineStageEnum = z.enum([
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "NEGOTIATION",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// Create lead
export const createLeadSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  companyName: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  mobile: z.string().max(20).optional().nullable(),
  source: leadSourceEnum.default("OTHER"),
  sourceDetails: z.string().max(500).optional().nullable(),
  pipelineStage: leadPipelineStageEnum.default("NEW"),
  status: leadStatusEnum.default("NEW"),
  priority: priorityEnum.default("MEDIUM"),
  initialNotes: z.string().max(2000).optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
});

// Update lead
export const updateLeadSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  companyName: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  mobile: z.string().max(20).optional().nullable(),
  source: leadSourceEnum.optional(),
  sourceDetails: z.string().max(500).optional().nullable(),
  pipelineStage: leadPipelineStageEnum.optional(),
  status: leadStatusEnum.optional(),
  priority: priorityEnum.optional(),
  score: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  initialNotes: z.string().max(2000).optional().nullable(),
  nextFollowUpAt: z.string().optional().nullable(),
});

// Convert lead to client
export const convertLeadSchema = z.object({
  estimatedValue: z.number().min(0, "Value must be positive"),
});

// ================================
// TYPE EXPORTS
// ================================

export type SetupInput = z.infer<typeof setupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
export type LeadSource = z.infer<typeof leadSourceEnum>;
export type LeadStatus = z.infer<typeof leadStatusEnum>;
export type LeadPipelineStage = z.infer<typeof leadPipelineStageEnum>;
export type Priority = z.infer<typeof priorityEnum>;