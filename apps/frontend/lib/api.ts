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
  status: string;
  lifetimeValue: number;
  accountManagerId: string;
  createdAt: string;
  updatedAt: string;
};

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

export { ApiError };

