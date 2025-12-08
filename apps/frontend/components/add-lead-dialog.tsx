"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { leads, type CreateLeadData, type LeadSource, type Priority, type LeadStatus, type LeadPipelineStage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { auth, type User } from "@/lib/api";
import { toast } from "sonner";

const LEAD_SOURCES: { value: LeadSource; label: string }[] = [
  { value: "WEBSITE", label: "Website" },
  { value: "LINKEDIN", label: "LinkedIn" },
  { value: "REFERRAL", label: "Referral" },
  { value: "COLD_CALL", label: "Cold Call" },
  { value: "TRADE_SHOW", label: "Trade Show" },
  { value: "PARTNER", label: "Partner" },
  { value: "EMAIL_CAMPAIGN", label: "Email Campaign" },
  { value: "OTHER", label: "Other" },
];

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "ATTEMPTING_CONTACT", label: "Attempting Contact" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "NURTURING", label: "Nurturing" },
];

const PIPELINE_STAGES: { value: LeadPipelineStage; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "PROPOSAL", label: "Proposal" },
  { value: "NEGOTIATION", label: "Negotiation" },
];

type AddLeadDialogProps = {
  onLeadAdded: () => void;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AddLeadDialog({ onLeadAdded, children, open: externalOpen, onOpenChange }: AddLeadDialogProps) {
  const { user: currentUser } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  
  // Use external open state if provided, otherwise use internal state
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };
  const [formData, setFormData] = useState<CreateLeadData & { ownerId?: string }>({
    name: "",
    companyName: "",
    email: "",
    mobile: "",
    source: "OTHER",
    sourceDetails: "",
    pipelineStage: "NEW",
    status: "NEW",
    priority: "MEDIUM",
    initialNotes: "",
    nextFollowUpAt: "",
    ownerId: currentUser?.id,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      companyName: "",
      email: "",
      mobile: "",
      source: "OTHER",
      sourceDetails: "",
      pipelineStage: "NEW",
      status: "NEW",
      priority: "MEDIUM",
      initialNotes: "",
      nextFollowUpAt: "",
      ownerId: currentUser?.id,
    });
  };

  // Fetch available users when dialog opens
  const fetchUsers = async () => {
    if (!currentUser) return;
    setUsersLoading(true);
    try {
      const { users: allUsers } = await auth.listUsers();
      // Filter users based on current user's role
      const filteredUsers = allUsers.filter((u) => {
        if (currentUser.role === "ADMIN") {
          // Admin can assign to anyone
          return true;
        } else if (currentUser.role === "MANAGER") {
          // Manager can assign to themselves or employees
          return u.id === currentUser.id || u.role === "EMPLOYEE";
        } else {
          // Employee can only assign to themselves
          return u.id === currentUser.id;
        }
      });
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      // Fallback: at least show current user
      setUsers([currentUser]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    try {
      await leads.create({
        ...formData,
        companyName: formData.companyName || null,
        email: formData.email || null,
        mobile: formData.mobile || null,
        sourceDetails: formData.source === "OTHER" ? formData.sourceDetails : null,
        initialNotes: formData.initialNotes || null,
        nextFollowUpAt: formData.nextFollowUpAt || null,
      });

      toast.success("Lead created successfully");
      setIsOpen(false);
      resetForm();
      onLeadAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => {
      setIsOpen(newOpen);
      if (newOpen) {
        fetchUsers();
      }
    }}>
      <DialogTrigger asChild>{children && children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the lead details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Contact Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Acme Inc."
                />
              </div>
            </div>

            {/* Email & Mobile - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input
                  id="mobile"
                  value={formData.mobile || ""}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+1 234 567 890"
                />
              </div>
            </div>

            {/* Lead Owner - Only show if admin/manager or employee can see their own */}
            {(currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER") && (
              <div className="grid gap-2">
                <Label>Lead Owner</Label>
                <Select
                  value={formData.ownerId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ownerId: value })
                  }
                  disabled={usersLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName} {u.id === currentUser?.id ? "(You)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status & Pipeline Stage - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as LeadStatus })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Pipeline Stage</Label>
                <Select
                  value={formData.pipelineStage}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pipelineStage: value as LeadPipelineStage })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PIPELINE_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority & Next Follow Up - Two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value as Priority })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nextFollowUpAt">Next Follow Up</Label>
                <Input
                  id="nextFollowUpAt"
                  type="datetime-local"
                  value={formData.nextFollowUpAt || ""}
                  onChange={(e) => setFormData({ ...formData, nextFollowUpAt: e.target.value })}
                />
              </div>
            </div>

            {/* Source & Source Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(value) =>
                    setFormData({ ...formData, source: value as LeadSource })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {formData.source === "OTHER" && (
                <div className="grid gap-2">
                  <Label htmlFor="sourceDetails">Source Details</Label>
                  <Input
                    id="sourceDetails"
                    value={formData.sourceDetails || ""}
                    onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
                    placeholder="Specify source..."
                  />
                </div>
              )}
            </div>

            {/* Initial Notes - Full width textarea */}
            <div className="grid gap-2">
              <Label htmlFor="initialNotes">Initial Notes</Label>
              <textarea
                id="initialNotes"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.initialNotes || ""}
                onChange={(e) => setFormData({ ...formData, initialNotes: e.target.value })}
                placeholder="Any initial notes about this lead..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
