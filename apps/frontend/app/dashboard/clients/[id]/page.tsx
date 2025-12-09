"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clients as clientsApi,
  type Client,
  type Deal,
  type Document,
  type Task,
  type Meeting,
  type Note,
  type AddDealData,
  type AddDocumentData,
  type AddTaskData,
  type AddMeetingData,
  type AddNoteData,
  type UpdateClientData,
  type DealStage,
  type Priority,
  type TaskType,
} from "@/lib/api";
import { toast } from "sonner";

const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  DISCOVERY: "Discovery",
  PROPOSAL_SENT: "Proposal Sent",
  NEGOTIATION: "Negotiation",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

const DEAL_STAGE_STYLES: Record<DealStage, string> = {
  DISCOVERY: "bg-blue-100 text-blue-700 border-blue-200",
  PROPOSAL_SENT: "bg-purple-100 text-purple-700 border-purple-200",
  NEGOTIATION: "bg-amber-100 text-amber-700 border-amber-200",
  CLOSED_WON: "bg-green-100 text-green-700 border-green-200",
  CLOSED_LOST: "bg-red-100 text-red-700 border-red-200",
};

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchClient = useCallback(async () => {
    try {
      setLoading(true);
      const response = await clientsApi.get(clientId);
      setClient(response.client);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch client");
      router.push("/dashboard/clients");
    } finally {
      setLoading(false);
    }
  }, [clientId, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const formatCurrency = (value: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (!client) {
    return null;
  }

  const activeTasks = client.tasks?.filter((t) => !t.isCompleted) || [];
  const upcomingMeetings = client.meetings?.filter((m) => m.status === "SCHEDULED") || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/clients")}>
            ← Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{client.companyName}</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Client since {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>Edit Client</Button>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(client.lifetimeValue))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Active Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {client.deals?.filter((d) => d.stage !== "CLOSED_WON" && d.stage !== "CLOSED_LOST").length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{activeTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{client.documents?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Client Info & Links */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-neutral-500">Primary Contact</div>
                <div className="font-medium">{client.primaryContact}</div>
              </div>
              {client.email && (
                <div>
                  <div className="text-neutral-500">Email</div>
                  <div className="font-medium">{client.email}</div>
                </div>
              )}
              {client.mobile && (
                <div>
                  <div className="text-neutral-500">Phone</div>
                  <div className="font-medium">{client.mobile}</div>
                </div>
              )}
              {client.industry && (
                <div>
                  <div className="text-neutral-500">Industry</div>
                  <div className="font-medium">{client.industry}</div>
                </div>
              )}
              <div>
                <div className="text-neutral-500">Account Manager</div>
                <div className="font-medium">{client.accountManager.fullName}</div>
              </div>
            </CardContent>
          </Card>

          {/* External Links */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">External Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.googleSheetUrl && (
                <a
                  href={client.googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  📊 Google Sheets →
                </a>
              )}
              {client.notionPageUrl && (
                <a
                  href={client.notionPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  📝 Notion Page →
                </a>
              )}
              {client.slackChannel && (
                <div className="text-sm text-neutral-600">💬 Slack: {client.slackChannel}</div>
              )}
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:underline"
                >
                  🌐 Website →
                </a>
              )}
              {!client.googleSheetUrl && !client.notionPageUrl && !client.slackChannel && !client.website && (
                <div className="text-sm text-neutral-500">No external links added</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle Column - Deals & Documents */}
        <div className="space-y-6 lg:col-span-2">
          {/* Deals/Revenue Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Deals & Revenue</CardTitle>
              <Button size="sm" onClick={() => setDealDialogOpen(true)}>
                + Add Deal
              </Button>
            </CardHeader>
            <CardContent>
              {client.deals && client.deals.length > 0 ? (
                <div className="space-y-3">
                  {client.deals.map((deal) => (
                    <div key={deal.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{deal.title}</div>
                        <div className="text-sm text-neutral-500 mt-1">
                          {deal.description && <span className="mr-3">{deal.description}</span>}
                          {deal.expectedCloseDate && (
                            <span className="text-xs">Due: {formatDate(deal.expectedCloseDate)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(Number(deal.value), deal.currency)}
                          </div>
                          <div className="text-xs text-neutral-500">{deal.probability}% probability</div>
                        </div>
                        <Badge className={`${DEAL_STAGE_STYLES[deal.stage]} border-0`}>
                          {DEAL_STAGE_LABELS[deal.stage]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No deals yet. Add your first deal to start tracking revenue.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Documents</CardTitle>
              <Button size="sm" onClick={() => setDocumentDialogOpen(true)}>
                + Add Document
              </Button>
            </CardHeader>
            <CardContent>
              {client.documents && client.documents.length > 0 ? (
                <div className="space-y-2">
                  {client.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 border rounded hover:bg-neutral-50">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {doc.isLink ? "🔗" : doc.fileType.includes("pdf") ? "📄" : "🖼️"}
                        </span>
                        <div>
                          <div className="text-sm font-medium">{doc.name}</div>
                          {doc.category && (
                            <div className="text-xs text-neutral-500">{doc.category}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  No documents uploaded yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks & Meetings */}
          <div className="grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Tasks</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setTaskDialogOpen(true)}>
                  + Add
                </Button>
              </CardHeader>
              <CardContent>
                {activeTasks.length > 0 ? (
                  <div className="space-y-2">
                    {activeTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="text-sm p-2 border rounded">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-neutral-500">Due: {formatDate(task.dueDate)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">No pending tasks</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base">Meetings</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setMeetingDialogOpen(true)}>
                  + Schedule
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingMeetings.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingMeetings.slice(0, 5).map((meeting) => (
                      <div key={meeting.id} className="text-sm p-2 border rounded">
                        <div className="font-medium">{meeting.title}</div>
                        <div className="text-xs text-neutral-500">
                          {formatDateTime(meeting.startTime)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500">No upcoming meetings</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Notes</CardTitle>
              <Button size="sm" onClick={() => setNoteDialogOpen(true)}>
                + Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {client.notes && client.notes.length > 0 ? (
                <div className="space-y-3">
                  {client.notes.map((note) => (
                    <div key={note.id} className="p-3 border rounded-lg bg-yellow-50">
                      {note.isPinned && (
                        <div className="text-xs text-yellow-600 font-medium mb-1">📌 Pinned</div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{note.content}</div>
                      <div className="text-xs text-neutral-500 mt-2">
                        {note.author.fullName} • {formatDate(note.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">No notes yet</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs - will add in next part */}
      <AddDealDialog
        open={dealDialogOpen}
        onOpenChange={setDealDialogOpen}
        clientId={clientId}
        onSuccess={fetchClient}
      />
      <AddDocumentDialog
        open={documentDialogOpen}
        onOpenChange={setDocumentDialogOpen}
        clientId={clientId}
        onSuccess={fetchClient}
      />
      <AddTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        clientId={clientId}
        onSuccess={fetchClient}
      />
      <AddMeetingDialog
        open={meetingDialogOpen}
        onOpenChange={setMeetingDialogOpen}
        clientId={clientId}
        onSuccess={fetchClient}
      />
      <AddNoteDialog
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
        clientId={clientId}
        onSuccess={fetchClient}
      />
    </div>
  );
}

// Add Deal Dialog Component
function AddDealDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddDealData>({
    title: "",
    value: 0,
    stage: "DISCOVERY",
    probability: 50,
    currency: "INR",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.addDeal(clientId, formData);
      toast.success("Deal added successfully");
      onOpenChange(false);
      onSuccess();
      setFormData({ title: "", value: 0, stage: "DISCOVERY", probability: 50, currency: "INR" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add deal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Deal</DialogTitle>
          <DialogDescription>Add a new revenue opportunity for this client</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Deal Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Website Redesign Project 2025"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="value">
                  Deal Value <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="probability">Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value as DealStage })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DISCOVERY">Discovery</SelectItem>
                  <SelectItem value="PROPOSAL_SENT">Proposal Sent</SelectItem>
                  <SelectItem value="NEGOTIATION">Negotiation</SelectItem>
                  <SelectItem value="CLOSED_WON">Closed Won</SelectItem>
                  <SelectItem value="CLOSED_LOST">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Document Dialog Component
function AddDocumentDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddDocumentData>({
    name: "",
    isLink: true,
    url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.addDocument(clientId, formData);
      toast.success("Document added successfully");
      onOpenChange(false);
      onSuccess();
      setFormData({ name: "", isLink: true, url: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add document");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>
            Add a link to a document (S3 upload coming soon)
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="doc-name">
                Document Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Contract 2025"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-url">
                Document URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="doc-url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="doc-category">Category</Label>
              <Input
                id="doc-category"
                value={formData.category || ""}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Contract, Proposal, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Task Dialog
function AddTaskDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddTaskData>({
    title: "",
    dueDate: "",
    priority: "MEDIUM",
    type: "GENERAL",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.addTask(clientId, formData);
      toast.success("Task added successfully");
      onOpenChange(false);
      onSuccess();
      setFormData({ title: "", dueDate: "", priority: "MEDIUM", type: "GENERAL" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add task");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Meeting Dialog
function AddMeetingDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddMeetingData>({
    title: "",
    startTime: "",
    endTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.addMeeting(clientId, formData);
      toast.success("Meeting scheduled successfully");
      onOpenChange(false);
      onSuccess();
      setFormData({ title: "", startTime: "", endTime: "" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Start Time</Label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>End Time</Label>
              <Input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Note Dialog
function AddNoteDialog({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AddNoteData>({
    content: "",
    isPinned: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await clientsApi.addNote(clientId, formData);
      toast.success("Note added successfully");
      onOpenChange(false);
      onSuccess();
      setFormData({ content: "", isPinned: false });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>
                Note <span className="text-red-500">*</span>
              </Label>
              <Textarea
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                rows={5}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="pinned"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              />
              <Label htmlFor="pinned">Pin this note</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
