"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { auth, type User, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateUserDialog } from "@/components/create-user-dialog";

export default function UsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.replace("/dashboard");
      return;
    }
    fetchUsers();
  }, [currentUser, router]);

  async function fetchUsers() {
    try {
      const { users } = await auth.listUsers();
      setUsers(users);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        router.replace("/dashboard");
      } else {
        toast.error("Failed to fetch users");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleToggleActive(userId: string) {
    try {
      const { user: updatedUser, message } = await auth.toggleUserActive(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
      toast.success(message);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update user status");
      }
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "ADMIN":
        return "default";
      case "MANAGER":
        return "secondary";
      default:
        return "outline";
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage team members and their access levels
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-neutral-900 hover:bg-neutral-800"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {users.filter((u) => u.role === "ADMIN").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                />
              </svg>
              <h3 className="mt-4 text-sm font-medium text-neutral-900">No users yet</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Get started by adding your first team member
              </p>
              <Button
                className="mt-4 bg-neutral-900 hover:bg-neutral-800"
                onClick={() => setShowCreateDialog(true)}
              >
                Add User
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-700">
                            {user.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{user.fullName}</p>
                            <p className="text-sm text-neutral-500">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              user.isActive ? "bg-green-500" : "bg-neutral-300"
                            }`}
                          />
                          <span className="text-sm text-neutral-600">
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {user.id !== currentUser?.id && user.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user.id)}
                            className="text-neutral-600 hover:text-neutral-900"
                          >
                            {user.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="text-xs text-neutral-400">You</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create user dialog */}
      <CreateUserDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onUserCreated={fetchUsers}
      />
    </div>
  );
}

