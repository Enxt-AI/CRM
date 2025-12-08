"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { AddLeadDialog } from "@/components/add-lead-dialog";
import { leads as leadsApi, type Lead, type LeadPipelineStage, type Priority } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const PIPELINE_STAGES: { value: LeadPipelineStage; label: string; color: string }[] = [
  { value: "NEW", label: "New", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "CONTACTED", label: "Contacted", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { value: "PROPOSAL", label: "Proposal", color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "NEGOTIATION", label: "Negotiation", color: "bg-orange-100 text-orange-700 border-orange-200" },
];

const PRIORITY_STYLES: Record<Priority, string> = {
  LOW: "bg-neutral-100 text-neutral-600",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  LINKEDIN: "LinkedIn",
  REFERRAL: "Referral",
  COLD_CALL: "Cold Call",
  TRADE_SHOW: "Trade Show",
  PARTNER: "Partner",
  EMAIL_CAMPAIGN: "Email Campaign",
  OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  ATTEMPTING_CONTACT: "Attempting",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  NURTURING: "Nurturing",
  DISQUALIFIED: "Disqualified",
  CONVERTED: "Converted",
};

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [leadsList, setLeadsList] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [countByStage, setCountByStage] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [estimatedValue, setEstimatedValue] = useState("");
  const [converting, setConverting] = useState(false);
  const [draggedLead, setDraggedLead] = useState<Lead | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<{ name: string; notes: string | null } | null>(null);
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(searchParams?.get("openDialog") === "true");

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const response = await leadsApi.list();
      setLeadsList(response.leads);
      setCountByStage(response.countByStage);
      setTotal(response.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPipelineStageStyle = (stage: LeadPipelineStage) => {
    return PIPELINE_STAGES.find((s) => s.value === stage)?.color || "bg-neutral-100 text-neutral-600";
  };

  const getPipelineStageLabel = (stage: LeadPipelineStage) => {
    return PIPELINE_STAGES.find((s) => s.value === stage)?.label || stage;
  };

  const handleConvertClick = (lead: Lead) => {
    setSelectedLead(lead);
    setEstimatedValue("");
    setConvertDialogOpen(true);
  };

  const handleConvert = async () => {
    if (!selectedLead) return;
    const value = parseFloat(estimatedValue);
    if (isNaN(value) || value < 0) {
      toast.error("Please enter a valid estimated value");
      return;
    }

    setConverting(true);
    try {
      await leadsApi.convert(selectedLead.id, { estimatedValue: value });
      toast.success("Lead converted to client successfully!");
      setConvertDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to convert lead");
    } finally {
      setConverting(false);
    }
  };

  const handleDragStart = (lead: Lead) => {
    setDraggedLead(lead);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stage: LeadPipelineStage) => {
    if (!draggedLead || draggedLead.pipelineStage === stage) {
      setDraggedLead(null);
      return;
    }

    try {
      await leadsApi.update(draggedLead.id, { pipelineStage: stage });
      toast.success(`Lead moved to ${getPipelineStageLabel(stage)}`);
      fetchLeads();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update lead");
    } finally {
      setDraggedLead(null);
    }
  };

  const handleNotesClick = (lead: Lead) => {
    setSelectedNotes({
      name: lead.name,
      notes: lead.initialNotes,
    });
    setNotesDialogOpen(true);
  };

  const getLeadsByStage = (stage: LeadPipelineStage) => {
    return leadsList.filter((lead) => lead.pipelineStage === stage);
  };

  useEffect(() => {
    if (addLeadDialogOpen && searchParams?.get("openDialog") === "true") {
      // Clean up the URL parameter
      router.replace("/dashboard/leads");
    }
  }, [addLeadDialogOpen, searchParams, router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Leads</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Manage and track your sales leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-neutral-200 p-1">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "table"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "kanban"
                  ? "bg-neutral-900 text-white"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              Kanban
            </button>
          </div>
          <AddLeadDialog onLeadAdded={fetchLeads}>
            <Button>
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Lead
            </Button>
          </AddLeadDialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{total}</div>
          </CardContent>
        </Card>
        {PIPELINE_STAGES.map((stage) => (
          <Card key={stage.value}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-neutral-500">{stage.label}</CardTitle>
              <div className={`h-2 w-2 rounded-full ${stage.color.split(" ")[0]}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-neutral-900">
                {countByStage[stage.value] || 0}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        </div>
      ) : leadsList.length === 0 ? (
        /* Empty State */
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
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
              <h3 className="mt-4 text-sm font-medium text-neutral-900">No leads yet</h3>
              <p className="mt-1 text-sm text-neutral-500">
                Get started by adding your first lead
              </p>
              <div className="mt-4">
                <AddLeadDialog onLeadAdded={fetchLeads}>
                  <Button>Add Lead</Button>
                </AddLeadDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">All Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Next Follow Up</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leadsList.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{lead.name}</div>
                          {lead.email && (
                            <div className="text-xs text-neutral-500">{lead.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-neutral-600">
                        {lead.companyName || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-600">
                          {STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPipelineStageStyle(lead.pipelineStage)} border-0`}>
                          {getPipelineStageLabel(lead.pipelineStage)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${PRIORITY_STYLES[lead.priority]} border-0`}>
                          {lead.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-neutral-600">{lead.owner.fullName}</TableCell>
                      <TableCell className="text-neutral-500">
                        {formatDateTime(lead.nextFollowUpAt)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-neutral-600">
                          {SOURCE_LABELS[lead.source] || lead.source}
                          {lead.source === "OTHER" && lead.sourceDetails && (
                            <span className="block text-xs text-neutral-400">
                              {lead.sourceDetails}
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleNotesClick(lead)}
                          className="text-sm text-neutral-500 hover:text-neutral-900 hover:underline max-w-[150px] truncate block text-left"
                        >
                          {lead.initialNotes ? "View Notes" : "—"}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvertClick(lead)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Convert
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-4 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div
              key={stage.value}
              className="rounded-lg border border-neutral-200 bg-neutral-50 p-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.value)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-neutral-900">{stage.label}</h3>
                <Badge className={`${stage.color} border`}>
                  {countByStage[stage.value] || 0}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {getLeadsByStage(stage.value).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead)}
                    className={`rounded-lg border bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md ${
                      draggedLead?.id === lead.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-neutral-900 text-sm">{lead.name}</p>
                        {lead.companyName && (
                          <p className="text-xs text-neutral-500">{lead.companyName}</p>
                        )}
                      </div>
                      <Badge className={`${PRIORITY_STYLES[lead.priority]} border-0 text-xs`}>
                        {lead.priority}
                      </Badge>
                    </div>
                    <div className="text-xs text-neutral-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <span className="text-neutral-400">Owner:</span>
                        {lead.owner.fullName}
                      </div>
                      {lead.nextFollowUpAt && (
                        <div className="flex items-center gap-1">
                          <span className="text-neutral-400">Follow up:</span>
                          {formatDateTime(lead.nextFollowUpAt)}
                        </div>
                      )}
                    </div>
                    <div className="mt-2 pt-2 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleConvertClick(lead)}
                        className="w-full text-green-600 hover:bg-green-50 text-xs h-7"
                      >
                        Convert to Client
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Convert to Client Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Convert to Client</DialogTitle>
            <DialogDescription>
              {selectedLead && (
                <>
                  Converting <strong>{selectedLead.name}</strong>
                  {selectedLead.companyName && ` from ${selectedLead.companyName}`} to a client.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="estimatedValue">
                Estimated Value (₹) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estimatedValue"
                type="number"
                min="0"
                step="0.01"
                value={estimatedValue}
                onChange={(e) => setEstimatedValue(e.target.value)}
                placeholder="Enter estimated deal value"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConvertDialogOpen(false)}
              disabled={converting}
            >
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={converting}>
              {converting ? "Converting..." : "Convert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Lead Dialog - Manual control based on query param */}
      <AddLeadDialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen} onLeadAdded={fetchLeads} />

      {/* View Notes Dialog */}
      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Lead Notes</DialogTitle>
            <DialogDescription>
              {selectedNotes?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 max-h-[300px] overflow-y-auto">
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                {selectedNotes?.notes || "No notes available"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

