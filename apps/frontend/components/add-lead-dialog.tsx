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
import { leads, type CreateLeadData, type LeadSource, type Priority } from "@/lib/api";
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

type AddLeadDialogProps = {
  onLeadAdded: () => void;
  children: React.ReactNode;
};

export function AddLeadDialog({ onLeadAdded, children }: AddLeadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateLeadData>({
    name: "",
    companyName: "",
    email: "",
    mobile: "",
    source: "OTHER",
    sourceDetails: "",
    priority: "MEDIUM",
  });

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
        sourceDetails: formData.sourceDetails || null,
      });

      toast.success("Lead created successfully");
      setOpen(false);
      setFormData({
        name: "",
        companyName: "",
        email: "",
        mobile: "",
        source: "OTHER",
        sourceDetails: "",
        priority: "MEDIUM",
      });
      onLeadAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          <DialogDescription>
            Enter the lead details below. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name - Required */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            {/* Company Name */}
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={formData.companyName || ""}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Acme Inc."
              />
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

            {/* Source & Priority - Two columns */}
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
            </div>

            {/* Source Details */}
            <div className="grid gap-2">
              <Label htmlFor="sourceDetails">Source Details</Label>
              <Input
                id="sourceDetails"
                value={formData.sourceDetails || ""}
                onChange={(e) => setFormData({ ...formData, sourceDetails: e.target.value })}
                placeholder="LinkedIn Ad Campaign Q4"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
