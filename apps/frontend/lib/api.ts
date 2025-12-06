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

export { ApiError };

