"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { clients as clientsApi, users as usersApi, type Client, type User, type Role } from "@/lib/api";
import { toast } from "sonner";

type EditClientDialogProps = {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentUserRole: Role;
  currentUserId: string;
};

export function EditClientDialog({ client, open, onOpenChange, onSuccess, currentUserRole, currentUserId }: EditClientDialogProps) {
  const [formData, setFormData] = useState({
    companyName: client.companyName,
    primaryContact: client.primaryContact,
    email: client.email || "",
    mobile: client.mobile || "",
    industry: client.industry || "",
    domain: client.domain || "",
    companySize: client.companySize || "",
    gstNumber: client.gstNumber || "",
    address: client.address || "",
    status: client.status,
    estimatedValue: client.estimatedValue?.toString() || "",
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users list for account manager dropdown (admin/manager only)
  const isAdminOrManager = currentUserRole === "ADMIN" || currentUserRole === "MANAGER";

  // Load users when dialog opens (only if admin/manager)
  useEffect(() => {
    if (open && isAdminOrManager) {
      usersApi.list().then(({ users }: { users: User[] }) => setUsers(users));
    }
  }, [open, isAdminOrManager]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare update data
      const updateData: any = {
        companyName: formData.companyName,
        primaryContact: formData.primaryContact,
        email: formData.email || null,
        mobile: formData.mobile || null,
        industry: formData.industry || null,
        domain: formData.domain || null,
        companySize: formData.companySize || null,
        gstNumber: formData.gstNumber || null,
        address: formData.address || null,
      };

      // Only include admin/manager fields if user has permission
      if (isAdminOrManager) {
        updateData.status = formData.status;
        updateData.estimatedValue = formData.estimatedValue ? parseFloat(formData.estimatedValue) : null;
      }

      await clientsApi.update(client.id, updateData);
      toast.success("Client updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <p className="text-sm text-neutral-500 mt-2">
            Update client information. Links are managed via the "Add Link" button on the client page.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-neutral-700">Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryContact">Primary Contact *</Label>
                  <Input
                    id="primaryContact"
                    value={formData.primaryContact}
                    onChange={(e) => setFormData({ ...formData, primaryContact: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Phone</Label>
                  <Input
                    id="mobile"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Input
                    id="companySize"
                    value={formData.companySize}
                    onChange={(e) => setFormData({ ...formData, companySize: e.target.value })}
                    placeholder="e.g., 50-100 employees"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={formData.gstNumber}
                    onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Admin/Manager Only Fields */}
            {isAdminOrManager && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-neutral-700">Management (Admin/Manager Only)</h3>
                <p className="text-xs text-neutral-500">Note: External links are managed via the "Add Link" button on the client page. Lifetime Value is auto-calculated from deals.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="CHURNED">Churned</SelectItem>
                        <SelectItem value="ON_HOLD">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">Estimated Future Value (₹)</Label>
                    <Input
                      id="estimatedValue"
                      type="number"
                      step="0.01"
                      value={formData.estimatedValue}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                      placeholder="Potential future value"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
