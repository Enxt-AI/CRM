import { z } from "zod";


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
  ownerId: z.string().uuid().optional(),
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
  ownerId: z.string().uuid().optional(),
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
export const clientStatusEnum = z.enum(["ACTIVE", "INACTIVE", "CHURNED", "PAUSED"]);

export const updateClientSchema = z.object({
  companyName: z.string().min(2).max(200).optional(),
  primaryContact: z.string().min(2).max(100).optional(),
  email: z.string().email("Invalid email address").optional().nullable().or(z.literal("")),
  mobile: z.string().max(20).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  domain: z.string().max(100).optional().nullable(),
  companySize: z.string().max(50).optional().nullable(),
  gstNumber: z.string().max(50).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  website: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  googleSheetUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  notionPageUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  slackChannel: z.string().max(100).optional().nullable(),
  status: clientStatusEnum.optional(),
  lifetimeValue: z.number().min(0).optional(),
  estimatedValue: z.number().min(0).optional().nullable(),
});

// Add document (for both leads and clients)
export const addDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  category: z.string().max(100).optional().nullable(),
  isLink: z.boolean().default(false),
  url: z.string().optional(), // For links
  // For file uploads, file will be handled separately via multipart
});

// Add task
export const addTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  priority: priorityEnum.default("MEDIUM"),
  type: z.enum(["GENERAL", "CALL", "EMAIL", "FOLLOW_UP", "PROPOSAL", "CONTRACT"]).default("GENERAL"),
  dueDate: z.string(), // ISO date string
  assignedToId: z.string().uuid().optional(), // If not provided, assign to current user
});

// Add meeting
export const addMeetingSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  meetingUrl: z.string().url("Invalid URL").optional().nullable().or(z.literal("")),
  startTime: z.string(), // ISO datetime string
  endTime: z.string().optional(), // Optional - defaults to 1 hour after start
});

// Add note
export const addNoteSchema = z.object({
  content: z.string().min(1).max(5000),
  isPinned: z.boolean().default(false),
});

// Add external link
export const addExternalLinkSchema = z.object({
  title: z.string().min(1).max(255),
  url: z.string().url("Invalid URL"),
});

// Add deal (revenue)
export const addDealSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  value: z.number().min(0),
  budget: z.number().min(0).optional().nullable(),
  currency: z.string().max(10).default("INR"),
  dealType: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  stage: z.enum(["QUALIFICATION", "NEEDS_ANALYSIS", "VALUE_PROPOSITION", "PROPOSAL_PRICE_QUOTE", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]).default("QUALIFICATION"),
  expectedCloseDate: z.string().optional().nullable(), // ISO date string
  nextSteps: z.string().max(1000).optional().nullable(),
  ownerId: z.string().uuid().optional(), // If not provided, use client's account manager
});

// Update deal
export const updateDealSchema = addDealSchema.partial();

// Soft delete deal
export const softDeleteDealSchema = z.object({
  reason: z.string().max(500).optional().nullable(),
});

// Restore deal
export const restoreDealSchema = z.object({});

export const dealStageEnum = z.enum(["QUALIFICATION", "NEEDS_ANALYSIS", "VALUE_PROPOSITION", "PROPOSAL_PRICE_QUOTE", "NEGOTIATION", "CLOSED_WON", "CLOSED_LOST"]);

export type DealStage = z.infer<typeof dealStageEnum>;

// ================================
// DOCUMENT MANAGEMENT SCHEMAS
// ================================

export const folderTypeEnum = z.enum(["SHARED", "PERSONAL"]);
export const documentTypeEnum = z.enum(["SHARED", "PERSONAL"]);

// Allowed file types (txt, pdf, png, jpeg, jpg)
export const ALLOWED_FILE_TYPES = [
  "text/plain",
  "application/pdf",
  "image/png",
  "image/jpeg",
];

export const MAX_FILE_SIZE = 1048576; // 1MB in bytes

// Create folder
export const createFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100),
  type: folderTypeEnum.default("SHARED"),
  parentId: z.string().uuid().optional().nullable(),
  sharedWithUserIds: z.array(z.string().uuid()).optional().default([]),
});

// Update folder (rename)
export const updateFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100).optional(),
  sharedWithUserIds: z.array(z.string().uuid()).optional(),
});

// Upload document metadata (file handled separately via multipart)
export const uploadDocumentSchema = z.object({
  name: z.string().min(1).max(255), // Filename
  type: documentTypeEnum.default("SHARED"),
  folderId: z.string().uuid().optional().nullable(),
  sharedWithUserIds: z.array(z.string().uuid()).optional().default([]),
});

// Update document
export const updateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  sharedWithUserIds: z.array(z.string().uuid()).optional(),
});

export type FolderType = z.infer<typeof folderTypeEnum>;
export type DocumentType = z.infer<typeof documentTypeEnum>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// MEETING SCHEMAS

export const meetingAttendeeStatusEnum = z.enum(["PENDING", "ACCEPTED", "DECLINED"]);

// Create meeting (standalone)
export const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  startTime: z.string(), // ISO datetime string
  endTime: z.string(), // ISO datetime string
  clientId: z.string().uuid().optional().nullable(),
  leadId: z.string().uuid().optional().nullable(),
  attendeeIds: z.array(z.string().uuid()).optional().default([]),
});

// Update meeting
export const updateMeetingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

// Invite users to meeting
export const inviteToMeetingSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, "At least one user ID is required"),
});

// Respond to meeting invitation
export const respondToMeetingSchema = z.object({
  response: z.enum(["ACCEPTED", "DECLINED"]),
});

export type MeetingAttendeeStatus = z.infer<typeof meetingAttendeeStatusEnum>;
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;
export type UpdateMeetingInput = z.infer<typeof updateMeetingSchema>;
export type InviteToMeetingInput = z.infer<typeof inviteToMeetingSchema>;
export type RespondToMeetingInput = z.infer<typeof respondToMeetingSchema>;