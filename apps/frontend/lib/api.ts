const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {} } = options;

  const config: RequestInit = {
    method,
    credentials: "include", // Include cookies
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // Handle non-JSON responses (like HTML error pages)
  const contentType = response.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  
  if (!isJson) {
    if (!response.ok) {
      throw new ApiError(response.status, `Server error: ${response.statusText}`);
    }
    // If it's a successful non-JSON response, return empty object
    return {} as T;
  }
  
  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(response.status, data.error || "An error occurred", data.details);
  }

  return data as T;
}

// Auth types
export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type User = {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  needsPasswordChange: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

// Lead types
export type LeadSource =
  | "WEBSITE"
  | "LINKEDIN"
  | "REFERRAL"
  | "COLD_CALL"
  | "TRADE_SHOW"
  | "PARTNER"
  | "EMAIL_CAMPAIGN"
  | "OTHER";

export type LeadStatus =
  | "NEW"
  | "ATTEMPTING_CONTACT"
  | "CONTACTED"
  | "QUALIFIED"
  | "NURTURING"
  | "DISQUALIFIED"
  | "CONVERTED";

export type LeadPipelineStage =
  | "NEW"
  | "CONTACTED"
  | "PROPOSAL"
  | "NEGOTIATION";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type Lead = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  mobile: string | null;
  source: LeadSource;
  sourceDetails: string | null;
  initialNotes: string | null;
  pipelineStage: LeadPipelineStage;
  status: LeadStatus;
  score: number;
  priority: Priority;
  tags: string[];
  ownerId: string;
  owner: {
    id: string;
    fullName: string;
    username: string;
  };
  isConverted: boolean;
  convertedAt: string | null;
  estimatedValue: number | null;
  lastContactedAt: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// Auth API
export const auth = {
  checkSetup: () => 
    request<{ setupRequired: boolean }>("/auth/check-setup"),

  setup: (data: { username: string; password: string; fullName: string }) =>
    request<{ message: string; user: User }>("/auth/setup", {
      method: "POST",
      body: data,
    }),

  signin: (data: { username: string; password: string }) =>
    request<{ message: string; user: User }>("/auth/signin", {
      method: "POST",
      body: data,
    }),

  signout: () =>
    request<{ message: string }>("/auth/signout", { method: "POST" }),

  me: () => request<{ user: User }>("/auth/me"),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/auth/change-password", {
      method: "POST",
      body: data,
    }),

  dismissPasswordChange: () =>
    request<{ message: string }>("/auth/dismiss-password-change", {
      method: "POST",
    }),

  createUser: (data: { username: string; fullName: string; role: "MANAGER" | "EMPLOYEE"; password?: string }) =>
    request<{ message: string; user: User; temporaryPassword: string }>("/auth/users", {
      method: "POST",
      body: data,
    }),

  listUsers: () => request<{ users: User[] }>("/auth/users"),

  toggleUserActive: (id: string) =>
    request<{ message: string; user: User }>(`/auth/users/${id}/toggle-active`, {
      method: "PATCH",
    }),
};

// Leads API
export type CreateLeadData = {
  name: string;
  companyName?: string | null;
  email?: string | null;
  mobile?: string | null;
  source?: LeadSource;
  sourceDetails?: string | null;
  pipelineStage?: LeadPipelineStage;
  status?: LeadStatus;
  priority?: Priority;
  initialNotes?: string | null;
  nextFollowUpAt?: string | null;
  tags?: string[];
};

export type UpdateLeadData = Partial<CreateLeadData> & {
  score?: number;
};

export type ConvertLeadData = {
  estimatedValue: number;
};

export type Client = {
  id: string;
  companyName: string;
  primaryContact: string;
  email: string | null;
  mobile: string | null;
  industry: string | null;
  domain: string | null;
  companySize: string | null;
  gstNumber: string | null;
  address: string | null;
  website: string | null;
  googleSheetUrl: string | null;
  notionPageUrl: string | null;
  slackChannel: string | null;
  status: ClientStatus;
  lifetimeValue: number;
  estimatedValue: number | null;
  accountManagerId: string;
  accountManager: {
    id: string;
    fullName: string;
    username: string;
  };
  deals?: Deal[];
  documents?: Document[];
  tasks?: Task[];
  meetings?: Meeting[];
  notes?: Note[];
  activities?: Activity[];
  originLead?: {
    id: string;
    name: string;
    source: string;
    convertedAt: string;
  };
  _count?: {
    deals: number;
    documents: number;
    tasks: number;
    meetings: number;
  };
  totalDealsValue?: number;
  activeDealsCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type ClientStatus = "ACTIVE" | "INACTIVE" | "CHURNED" | "PAUSED";

export type Deal = {
  id: string;
  title: string;
  description: string | null;
  value: number;
  budget: number | null;
  currency: string;
  dealType: string | null;
  industry: string | null;
  stage: DealStage;
  progress: number;
  probability: number;
  expectedCloseDate: string | null;
  actualCloseDate: string | null;
  nextSteps: string | null;
  clientId: string;
  ownerId: string;
  owner?: {
    id: string;
    fullName: string;
    username: string;
  };
  client?: {
    id: string;
    companyName: string;
    primaryContact: string;
    email: string | null;
    mobile: string | null;
    accountManagerId: string;
  };
  isDeleted: boolean;
  deletedAt: string | null;
  deletedById: string | null;
  deletedBy?: {
    id: string;
    fullName: string;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type DealStage = 
  | "QUALIFICATION" 
  | "NEEDS_ANALYSIS" 
  | "VALUE_PROPOSITION" 
  | "PROPOSAL_PRICE_QUOTE" 
  | "NEGOTIATION" 
  | "CLOSED_WON" 
  | "CLOSED_LOST";

export type Document = {
  id: string;
  name: string;
  url: string;
  fileType: string;
  fileSize: number | null;
  isLink: boolean;
  category: string | null;
  uploadedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  type: TaskType;
  isCompleted: boolean;
  completedAt: string | null;
  assignedToId: string;
  assignedTo: {
    id: string;
    fullName: string;
  };
  dueDate: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskType = "GENERAL" | "CALL" | "EMAIL" | "FOLLOW_UP" | "PROPOSAL" | "CONTRACT";

export type Meeting = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  meetingUrl: string | null;
  startTime: string;
  endTime: string;
  status: MeetingStatus;
  organizerId: string;
  organizer: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type MeetingStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

export type Note = {
  id: string;
  content: string;
  isPinned: boolean;
  authorId: string;
  author: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
};

export type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  isFollowUp: boolean;
  followUpDate: string | null;
  createdById: string;
  createdBy: {
    id: string;
    fullName: string;
  };
  occurredAt: string;
  createdAt: string;
};

export type ActivityType =
  | "CALL"
  | "EMAIL"
  | "MEETING"
  | "FOLLOW_UP"
  | "NOTE"
  | "STATUS_CHANGE"
  | "DOCUMENT_UPLOAD"
  | "TASK_COMPLETED"
  | "DEAL_CREATED"
  | "CONVERTED";

export const leads = {
  list: () =>
    request<{ leads: Lead[]; total: number; countByStage: Record<string, number> }>("/leads"),

  stats: () =>
    request<{
      total: number;
      converted: number;
      byStatus: Record<string, number>;
      bySource: Record<string, number>;
      byPriority: Record<string, number>;
      byStage: Record<string, number>;
    }>("/leads/stats"),

  get: (id: string) => request<{ lead: Lead }>(`/leads/${id}`),

  create: (data: CreateLeadData) =>
    request<{ message: string; lead: Lead }>("/leads", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: UpdateLeadData) =>
    request<{ message: string; lead: Lead }>(`/leads/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string }>(`/leads/${id}`, {
      method: "DELETE",
    }),

  convert: (id: string, data: ConvertLeadData) =>
    request<{ message: string; lead: Lead; client: Client }>(`/leads/${id}/convert`, {
      method: "POST",
      body: data,
    }),
};

// Clients API
export type UpdateClientData = Partial<{
  companyName: string;
  primaryContact: string;
  email: string | null;
  mobile: string | null;
  industry: string | null;
  domain: string | null;
  companySize: string | null;
  gstNumber: string | null;
  address: string | null;
  website: string | null;
  googleSheetUrl: string | null;
  notionPageUrl: string | null;
  slackChannel: string | null;
  status: ClientStatus;
  lifetimeValue: number;
  estimatedValue: number | null;
}>;

export type AddDocumentData = {
  name: string;
  category?: string | null;
  isLink: boolean;
  url?: string;
};

export type AddTaskData = {
  title: string;
  description?: string | null;
  priority?: Priority;
  type?: TaskType;
  dueDate: string;
  assignedToId?: string;
};

export type AddMeetingData = {
  title: string;
  description?: string | null;
  location?: string | null;
  meetingUrl?: string | null;
  startTime: string;
  endTime: string;
};

export type AddNoteData = {
  content: string;
  isPinned?: boolean;
};

export type AddDealData = {
  title: string;
  description?: string | null;
  value: number;
  budget?: number | null;
  currency?: string;
  dealType?: string | null;
  industry?: string | null;
  stage?: DealStage;
  probability?: number;
  expectedCloseDate?: string | null;
  nextSteps?: string | null;
  ownerId?: string;
};

export type UpdateDealData = Partial<AddDealData>;

export const clients = {
  list: () => request<{ clients: Client[]; total: number }>("/clients"),

  get: (id: string) => request<{ client: Client }>(`/clients/${id}`),

  update: (id: string, data: UpdateClientData) =>
    request<{ message: string; client: Client }>(`/clients/${id}`, {
      method: "PATCH",
      body: data,
    }),

  // Documents
  uploadDocument: async (clientId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/clients/${clientId}/documents/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, result.error || "Upload failed", result.details);
    }

    return result as Document;
  },

  getDocumentViewUrl: (clientId: string, documentId: string) =>
    request<{ url: string; fileName: string; fileType: string; expiresIn?: number }>(
      `/clients/${clientId}/documents/${documentId}/view`
    ),

  addDocument: (clientId: string, data: AddDocumentData) =>
    request<{ message: string; document: Document }>(`/clients/${clientId}/documents`, {
      method: "POST",
      body: data,
    }),

  deleteDocument: (clientId: string, documentId: string) =>
    request<{ message: string }>(`/clients/${clientId}/documents/${documentId}`, {
      method: "DELETE",
    }),

  // Tasks
  addTask: (clientId: string, data: AddTaskData) =>
    request<{ message: string; task: Task }>(`/clients/${clientId}/tasks`, {
      method: "POST",
      body: data,
    }),

  // Meetings
  addMeeting: (clientId: string, data: AddMeetingData) =>
    request<{ message: string; meeting: Meeting }>(`/clients/${clientId}/meetings`, {
      method: "POST",
      body: data,
    }),

  // Notes
  addNote: (clientId: string, data: AddNoteData) =>
    request<{ message: string; note: Note }>(`/clients/${clientId}/notes`, {
      method: "POST",
      body: data,
    }),

  // Deals
  addDeal: (clientId: string, data: AddDealData) =>
    request<{ message: string; deal: Deal }>(`/clients/${clientId}/deals`, {
      method: "POST",
      body: data,
    }),

  updateDeal: (clientId: string, dealId: string, data: UpdateDealData) =>
    request<{ message: string; deal: Deal }>(`/clients/${clientId}/deals/${dealId}`, {
      method: "PATCH",
      body: data,
    }),
};

// Deals API
export const deals = {
  list: (includeDeleted?: boolean) => 
    request<{ 
      deals: Deal[]; 
      dealsByStage: Record<DealStage, Deal[]>;
      stageValues: Record<DealStage, number>;
      totalValue: number;
      total: number;
    }>(`/deals${includeDeleted ? "?includeDeleted=true" : ""}`),

  archived: () =>
    request<{ deals: Deal[]; total: number }>("/deals/archived"),

  get: (id: string) => 
    request<{ deal: Deal }>(`/deals/${id}`),

  update: (id: string, data: UpdateDealData) =>
    request<{ message: string; deal: Deal }>(`/deals/${id}`, {
      method: "PATCH",
      body: data,
    }),

  softDelete: (id: string) =>
    request<{ message: string; deal: Deal }>(`/deals/${id}`, {
      method: "DELETE",
    }),

  restore: (id: string) =>
    request<{ message: string; deal: Deal }>(`/deals/${id}/restore`, {
      method: "POST",
    }),
};

export { ApiError };

// DOCUMENT MANAGEMENT TYPES

export type FolderType = "SHARED" | "PERSONAL";
export type DocumentType = "SHARED" | "PERSONAL";

export type SimpleUser = {
  id: string;
  fullName: string;
  username?: string;
};

export type Folder = {
  id: string;
  name: string;
  type: FolderType;
  parentId: string | null;
  parent?: {
    id: string;
    name: string;
  };
  children?: {
    id: string;
    name: string;
    type: FolderType;
  }[];
  managedDocuments?: {
    id: string;
    name: string;
    fileSize: number;
    fileType: string;
  }[];
  createdBy: SimpleUser;
  sharedWithUsers?: SimpleUser[];
  createdAt: string;
  updatedAt: string;
};

export type ManagedDocument = {
  id: string;
  name: string;
  s3Key: string;
  fileType: string;
  fileSize: number;
  type: DocumentType;
  folderId: string | null;
  folder?: {
    id: string;
    name: string;
    type: FolderType;
  };
  uploadedBy: SimpleUser;
  sharedWithUsers?: SimpleUser[];
  createdAt: string;
  updatedAt: string;
};

export type CreateFolderData = {
  name: string;
  type: FolderType;
  parentId?: string | null;
  sharedWithUserIds?: string[];
};

export type UpdateFolderData = {
  name?: string;
  sharedWithUserIds?: string[];
};

export type UploadDocumentData = {
  file: File;
  name?: string;
  type: DocumentType;
  folderId?: string | null;
  sharedWithUserIds?: string[];
};

export type UpdateDocumentData = {
  name?: string;
  sharedWithUserIds?: string[];
};

// DOCUMENT MANAGEMENT API

export const folders = {
  list: () =>
    request<Folder[]>("/folders"),

  get: (id: string) =>
    request<Folder>(`/folders/${id}`),

  create: (data: CreateFolderData) =>
    request<Folder>("/folders", {
      method: "POST",
      body: data,
    }),

  update: (id: string, data: UpdateFolderData) =>
    request<Folder>(`/folders/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string; documentsDeleted: number }>(`/folders/${id}`, {
      method: "DELETE",
    }),
};

export const documents = {
  list: () =>
    request<ManagedDocument[]>("/documents"),

  get: (id: string) =>
    request<ManagedDocument>(`/documents/${id}`),

  getViewUrl: (id: string) =>
    request<{ url: string; fileName: string; fileType: string; expiresIn: number }>(
      `/documents/${id}/view`
    ),

  upload: async (data: UploadDocumentData) => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("name", data.name || data.file.name);
    formData.append("type", data.type);
    if (data.folderId) {
      formData.append("folderId", data.folderId);
    }
    if (data.sharedWithUserIds?.length) {
      formData.append("sharedWithUserIds", JSON.stringify(data.sharedWithUserIds));
    }

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new ApiError(response.status, result.error || "Upload failed", result.details);
    }

    return result as ManagedDocument;
  },

  update: (id: string, data: UpdateDocumentData) =>
    request<ManagedDocument>(`/documents/${id}`, {
      method: "PATCH",
      body: data,
    }),

  delete: (id: string) =>
    request<{ message: string; fileName: string }>(`/documents/${id}`, {
      method: "DELETE",
    }),
};

// ================================
// USERS API
// ================================

export const users = {
  list: () =>
    request<{ users: User[]; total: number }>("/users"),
};

